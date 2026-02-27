import { useMutation } from "@tanstack/react-query";
import { validateDocument, type ValidateResult } from "@/lib/api-client";

type ValidateInput = {
  file: File;
  expectation: string;
};

export function useValidate() {
  return useMutation<ValidateResult, Error, ValidateInput>({
    mutationFn: ({ file, expectation }) =>
      validateDocument(file, expectation),
    retry: 1,
    retryDelay: 1000,
  });
}
