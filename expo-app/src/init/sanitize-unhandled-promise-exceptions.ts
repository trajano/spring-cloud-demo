// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
global.Promise = require("promise");

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
require("promise/lib/rejection-tracking").enable({
  allRejections: true,
  onUnhandled: (id: number, error: unknown) => {
    if (typeof error === "object" && error instanceof Error) {
      // not bothering with the stack because it's useless.
      console.error({
        name: error.name,
        message: error.message,
        cause: error.cause,
      });
    } else {
      console.error(
        id,
        error,
        typeof error === "object",
        error instanceof Error
      );
    }
  },
});
