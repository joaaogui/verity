import { useState, useCallback, useRef } from "react";
import { validateDocumentStream, type VerdictResult, type FieldsResult } from "@/lib/api-client";

export interface ValidateState {
  verdict: VerdictResult | null;
  fields: FieldsResult | null;
  isPending: boolean;
  isExtractingFields: boolean;
  error: Error | null;
}

export function useValidate() {
  const [verdict, setVerdict] = useState<VerdictResult | null>(null);
  const [fields, setFields] = useState<FieldsResult | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isExtractingFields, setIsExtractingFields] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortRef = useRef(false);

  const mutate = useCallback(
    async (
      input: { file: File; expectation: string },
      options?: { onSuccess?: (verdict: VerdictResult) => void }
    ) => {
      abortRef.current = false;
      setVerdict(null);
      setFields(null);
      setError(null);
      setIsPending(true);
      setIsExtractingFields(false);

      try {
        for await (const event of validateDocumentStream(input.file, input.expectation)) {
          if (abortRef.current) break;

          if (event.type === "verdict") {
            setVerdict(event.data);
            setIsPending(false);
            setIsExtractingFields(true);
            options?.onSuccess?.(event.data);
          } else if (event.type === "complete") {
            setFields(event.data);
            setIsExtractingFields(false);
          } else if (event.type === "error") {
            throw new Error(event.data.error);
          }
        }
      } catch (e) {
        setError(e instanceof Error ? e : new Error("Validation failed"));
        setIsPending(false);
        setIsExtractingFields(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    abortRef.current = true;
    setVerdict(null);
    setFields(null);
    setError(null);
    setIsPending(false);
    setIsExtractingFields(false);
  }, []);

  return { verdict, fields, isPending, isExtractingFields, error, mutate, reset };
}
