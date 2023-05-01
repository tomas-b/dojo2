import { Formu, addValidators, addComponents, FormuCallback } from "./Formu";
import { useState } from "react";
import "./App.css";

addValidators({
  required: (value) => !!value,
  isEmail: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  match: (value, { args, get }) => value === get(args[0]),
  isUpperCase: (value) => value === value.toUpperCase(),
  isPhoneNumber: (value) => /^\d{3}-\d{3}-\d{4}$/.test(value),
});

const errorMessages: Record<string, string> = {
  required: "This field is required",
  isEmail: "This field must be an email",
  match: "This field must match",
  isUpperCase: "This field must be uppercase",
  isPhoneNumber: "This field must be a phone number",
};

addComponents({
  __default: ({ value, onChange, config, errors }) => (
    <div
      className={`custom__input ${
        errors && (errors.length ? "error" : "success")
      }`}
    >
      <input
        type={config.type}
        value={value}
        onChange={onChange}
        placeholder={config.placeholder || config.label}
      />
      <div>
        {(errors ?? []).map((error: string) => (
          <span key={error}>🔴 {errorMessages[error]}</span>
        ))}
      </div>
    </div>
  ),
  submit: ({ config: { label } }) => (
    <button className="custom__btn" type="submit">
      {label}
    </button>
  ),
});

function App() {
  const [state, setState] = useState<FormuCallback>({
    data: {},
    errors: {},
    success: false,
  });

  return (
    <>
      <h2>Dojo2</h2>
      <Formu
        onSubmit={setState}
        inputs={[
          {
            label: "First Name",
            type: "text",
            validations: ["required", "isUpperCase"],
          },
          {
            label: "Last Name",
            type: "text",
            validations: ["required", "isUpperCase"],
          },
          {
            label: "Email",
            type: "text",
            validations: ["required", "isEmail"],
          },
          {
            label: "Phone",
            type: "text",
            placeholder: "123-456-7890",
            validations: ["isPhoneNumber"],
          },
          {
            ref: "pass1",
            label: "Password",
            type: "password",
            validations: ["required"],
          },
          {
            label: "Confirm Password",
            type: "password",
            validations: ["required", "match:pass1"],
          },
          { label: "check!", type: "submit", component: "submit" },
        ]}
      />
      {state.success ? (
        <>
          <div>Success!</div>
          <pre>{JSON.stringify(state.data, null, 2)}</pre>
        </>
      ) : (
        <ul>
          {Object.entries(state.errors).map(([label, errors]) => (
            <li key={label}>
              {label}:
              {errors.map((error, i) => (
                <span key={i}>{error}</span>
              ))}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default App;
