import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Loader2, Sparkles } from "lucide-react";

import AuthLayout from "../components/auth/AuthLayout";
import StepIndicator from "../components/auth/register/StepIndicator";
import AccountTypeStep from "../components/auth/register/AccountTypeStep";
import PersonalInfoStep from "../components/auth/register/PersonalInfoStep";
import RoleSpecificStep from "../components/auth/register/RoleSpecificStep";
import SecurityStep from "../components/auth/register/SecurityStep";
import AgreementsStep from "../components/auth/register/AgreementsStep";
import SocialAuthButtons from "../components/auth/register/SocialAuthButtons";
import { useAuth } from "../context/AuthContext";
import { getSchemaForStep } from "../utils/validation";

const TOTAL_STEPS = 5;

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({});
  const [serverError, setServerError] = useState("");

  const accountType = formData.accountType || "student";
  const schema = getSchemaForStep(currentStep, accountType);

  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: formData,
  });

  const handleNext = async (data) => {
    const isValid = await trigger();
    if (!isValid) return;

    const merged = { ...formData, ...data };
    setFormData(merged);

    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      await onSubmit(merged);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setFormData(getValues());
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAccountTypeChange = (type) => {
    setFormData({ ...formData, accountType: type });
    setValue("accountType", type);
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setServerError("");
    try {
      await registerUser({
        name: `${data.firstName} ${data.lastName}`,
        email: data.email,
        password: data.password,
        role: data.accountType,
        ...data,
      });
      navigate("/dashboard");
    } catch (err) {
      setServerError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <AccountTypeStep
            // eslint-disable-next-line react-hooks/incompatible-library
            value={watch("accountType") || formData.accountType}
            onChange={handleAccountTypeChange}
          />
        );
      case 1:
        return <PersonalInfoStep register={register} errors={errors} watch={watch} setValue={setValue} />;
      case 2:
        return <RoleSpecificStep role={accountType} register={register} errors={errors} />;
      case 3:
        return <SecurityStep register={register} errors={errors} watch={watch} />;
      case 4:
        return <AgreementsStep register={register} errors={errors} watch={watch} />;
      default:
        return null;
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join the verified talent network trusted by universities"
    >
      <StepIndicator currentStep={currentStep} />

      {serverError && (
        <div className="mb-4 rounded-xl border border-red-500/20 bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-300">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(handleNext)} className="space-y-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>

        {currentStep === 0 && <SocialAuthButtons />}

        <div className="flex items-center justify-between gap-3 pt-4">
          {currentStep > 0 ? (
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
          ) : (
            <Link
              to="/login"
              className="text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              Already have an account?
            </Link>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30 disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : currentStep === TOTAL_STEPS - 1 ? (
              <>
                <Sparkles className="h-4 w-4" />
                Complete Registration
              </>
            ) : (
              <>
                Continue <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </AuthLayout>
  );
}