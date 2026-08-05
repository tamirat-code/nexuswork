// Generic body-validation middleware factory. Pass a validator function
// (e.g. from shared/validators) to run against req.body before the controller runs.
export function validateBody(validatorFn) {
  return (req, res, next) => {
    try {
      validatorFn(req.body);
      next();
    } catch (err) {
      next(err);
    }
  };
}
