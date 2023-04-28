import { Formu, addValidators, addComponents } from "./Formu";
import "./App.css";

addValidators({
  required: (value) => !!value,
  isEmail: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  match: (value, { args, get }) => value === get(args[0]),
});

addComponents({
  firstName: ({ value, onChange }) => (
    <input
      type="text"
      value={value}
      onChange={onChange}
      style={{ background: "red" }}
    />
  ),
});

function App() {
  return (
    <>
      <h2>Dojo2</h2>
      <Formu
        inputs={[
          {
            label: "First Name",
            type: "text",
            validations: ["required"],
            component: "firstName",
          },
          { label: "Last Name", type: "text" },
          {
            label: "Email",
            type: "text",
            validations: ["required", "isEmail"],
          },
          { label: "Phone", type: "text" },
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
          { label: "Submit", type: "submit" },
        ]}
      />
    </>
  );
}

export default App;
