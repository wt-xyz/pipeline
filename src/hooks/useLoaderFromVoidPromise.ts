import React from "react";

export const useLoaderFromVoidPromise = <T = void>(
  promiseCall: (args?: T) => Promise<boolean>, // `args` is now an optional parameter
  args?: T, // `args` is optional and can be undefined
) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isError, setIsError] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const promiseFunction = async () => {
    setIsLoading(true);
    try {
      await promiseCall(args);
    } catch (e: unknown) {
      setIsError(true);
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("An unknown error occurred"); // Fallback message
      }
      return false;
    } finally {
      setIsLoading(false);
    }
    return true;
  };

  return { promiseFunction, isLoading, isError, error };
};
