import { User, Mail, Phone, Calendar, MapPin, Camera } from "lucide-react";

const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

const COUNTRIES = [
  { value: "ET", label: "Ethiopia 🇪🇹" },
  { value: "KE", label: "Kenya 🇰🇪" },
  { value: "US", label: "United States 🇺🇸" },
  { value: "UK", label: "United Kingdom 🇬🇧" },
  { value: "OTHER", label: "Other" },
];

export default function PersonalInfoStep({ register, errors, watch, setValue }) {
  const profilePicture = watch("profilePicture");

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setValue("profilePicture", reader.result);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div>
      <h2 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">
        Tell us about yourself
      </h2>
      <p className="mb-8 text-sm text-slate-500 dark:text-zinc-400">
        This information will appear on your public profile.
      </p>

      {/* Profile Picture */}
      <div className="mb-6 flex flex-col items-center">
        <label className="group relative cursor-pointer">
          <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-gradient-to-br from-blue-500 to-indigo-600 shadow-xl dark:border-slate-900">
            {profilePicture ? (
              <img src={profilePicture} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-white">
                <User className="h-10 w-10" />
              </div>
            )}
          </div>
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
            <Camera className="h-6 w-6 text-white" />
          </div>
          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        </label>
        <p className="mt-2 text-xs text-slate-500 dark:text-zinc-400">Click to upload photo</p>
      </div>

      <div className="space-y-4">
        {/* Names */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormField label="First Name *" icon={User} error={errors.firstName}>
            <input {...register("firstName")} placeholder="Selam" className={inputClass(errors.firstName)} />
          </FormField>
          <FormField label="Middle Name" icon={User}>
            <input {...register("middleName")} placeholder="Optional" className={inputClass()} />
          </FormField>
          <FormField label="Last Name *" icon={User} error={errors.lastName}>
            <input {...register("lastName")} placeholder="Abebe" className={inputClass(errors.lastName)} />
          </FormField>
        </div>

        {/* Username & Email */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Username *" icon={User} error={errors.username}>
            <input {...register("username")} placeholder="selam_abebe" className={inputClass(errors.username)} />
          </FormField>
          <FormField label="Email *" icon={Mail} error={errors.email}>
            <input {...register("email")} type="email" placeholder="you@example.com" className={inputClass(errors.email)} />
          </FormField>
        </div>

        {/* Phone & Gender */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Phone Number *" icon={Phone} error={errors.phone}>
            <input {...register("phone")} placeholder="+251912345678" className={inputClass(errors.phone)} />
          </FormField>
          <FormField label="Gender *" error={errors.gender}>
            <select {...register("gender")} className={inputClass(errors.gender)}>
              <option value="">Select gender</option>
              {GENDERS.map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </FormField>
        </div>

        {/* Date of Birth & Country */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Date of Birth *" icon={Calendar} error={errors.dateOfBirth}>
            <input {...register("dateOfBirth")} type="date" className={inputClass(errors.dateOfBirth)} />
          </FormField>
          <FormField label="Country *" icon={MapPin} error={errors.country}>
            <select {...register("country")} className={inputClass(errors.country)}>
              <option value="">Select country</option>
              {COUNTRIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </FormField>
        </div>

        {/* City */}
        <FormField label="City / Region *" icon={MapPin} error={errors.city}>
          <input {...register("city")} placeholder="Addis Ababa" className={inputClass(errors.city)} />
        </FormField>
      </div>
    </div>
  );
}

function FormField({ label, icon: Icon, error, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-zinc-300">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
        )}
        <div className={Icon ? "[&>*]:pl-10" : ""}>{children}</div>
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-500">{error.message}</p>
      )}
    </div>
  );
}

function inputClass(error) {
  return `w-full rounded-lg border bg-white py-2.5 pl-10 pr-3.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:bg-white/[0.03] dark:text-white dark:placeholder:text-zinc-600 ${
    error ? "border-red-500" : "border-slate-300 dark:border-white/10"
  }`;
}