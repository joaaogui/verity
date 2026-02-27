#!/bin/bash
cd "$(dirname "$0")"

PORT=${1:-3002}
BASE="http://localhost:$PORT"

echo "=========================================="
echo " Verity Test Suite — 10 Real Documents"
echo " Server: $BASE"
echo "=========================================="
echo ""

PASS=0
FAIL=0
ERR=0

run_test() {
  local num=$1 label=$2 file=$3 expect=$4 should_match=$5
  local tmp="/tmp/verity_test_${num}.txt"
  
  > "$tmp"
  timeout 18 curl -s -N --no-buffer -X POST "$BASE/api/validate" \
    -F "file=@$file" -F "expectation=$expect" > "$tmp" 2>/dev/null &
  local pid=$!
  
  local waited=0
  while [ $waited -lt 15 ]; do
    if grep -q "^data:" "$tmp" 2>/dev/null; then
      break
    fi
    sleep 1
    waited=$((waited + 1))
  done
  kill $pid 2>/dev/null
  wait $pid 2>/dev/null
  
  local data
  data=$(grep "^data:" "$tmp" | head -1 | sed 's/^data: //')
  rm -f "$tmp"
  
  if [ -z "$data" ]; then
    echo "$num. $label => ERROR (no verdict received)"
    ERR=$((ERR + 1))
    return
  fi
  
  local result
  result=$(echo "$data" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    m = d['matchesExpectation']
    t = d['processingTimeMs'] / 1000
    w = d['matchExplanation'][:80]
    print(f'{m}|{t:.1f}|{w}')
except Exception as e:
    print(f'ERROR|0|{e}')
")
  
  local match time_s why
  match=$(echo "$result" | cut -d'|' -f1)
  time_s=$(echo "$result" | cut -d'|' -f2)
  why=$(echo "$result" | cut -d'|' -f3-)
  
  local status
  if [ "$match" = "True" ] && [ "$should_match" = "true" ]; then
    status="PASS"
    PASS=$((PASS + 1))
  elif [ "$match" = "False" ] && [ "$should_match" = "false" ]; then
    status="PASS"
    PASS=$((PASS + 1))
  elif [ "$match" = "ERROR" ]; then
    status="ERROR"
    ERR=$((ERR + 1))
  else
    status="FAIL"
    FAIL=$((FAIL + 1))
  fi
  
  echo "$num. $label => $status | match=$match | ${time_s}s | $why"
}

run_test 01 "W-2 blank" "test-docs/real/w2-form-irs.pdf" "A blank IRS W-2 form" true
run_test 02 "W-2 vs pay stub" "test-docs/real/w2-sample-pitt.pdf" "A recent monthly pay stub" false
run_test 03 "Invoice" "test-docs/real/invoice-sliced.pdf" "A commercial invoice with line items" true
run_test 04 "Utility (CRWWD)" "test-docs/real/utility-bill-crwwd.pdf" "A utility bill with account number" true
run_test 05 "Utility vs ConEd" "test-docs/real/utility-bill-wheaton.pdf" "An electricity bill from ConEd" false
run_test 06 "1040 instructions" "test-docs/real/irs-1040-instructions.pdf" "A completed Form 1040" false
run_test 07 "Passport (MY)" "test-docs/real/passport-sample-malaysia.pdf" "A passport scan with photo" true
run_test 08 "Passport vs license" "test-docs/real/passport-sample-ultracamp.pdf" "A US drivers license" false
run_test 09 "1099 form" "test-docs/real/irs-form-1099.pdf" "An IRS Form 1099" true
run_test 10 "W-4 vs W-2" "test-docs/real/irs-form-w4.pdf" "A completed W-2 wage statement" false

TOTAL=$((PASS + FAIL + ERR))
echo ""
echo "=========================================="
echo " Results: $PASS/$TOTAL passed, $FAIL failed, $ERR errors"
echo "=========================================="
