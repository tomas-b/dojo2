import { Formu } from "./Formu";

function App() {
  return (
    <>
      <h2>Dojo2</h2>
      <Formu
        inputs={[
          {
            label: "First Name",
            type: "text",
            validation: (value) => value,
            component: ({ value, onChange }) => (
              <input
                type="text"
                value={value}
                onChange={onChange}
                style={{ background: "red" }}
              />
            ),
          },
          { label: "Last Name", type: "text" },
          {
            label: "Email",
            type: "text",
            validation: (value, { isEmail }) => isEmail(value),
          },
          { label: "Phone", type: "text" },
          {
            ref: "pass1",
            label: "Password",
            type: "password",
            validation: (value) => value,
          },
          {
            label: "Confirm Password",
            type: "password",
            validation: (value, { get }) => value && value === get("pass1"),
          },
          { label: "Submit", type: "submit" },
        ]}
      />
    </>
  );
}

export default App;
