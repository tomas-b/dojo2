import { useEffect } from "react";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
// import { devtools } from "zustand/middleware";

export type FormuCallback = {
  data: Record<string, string>;
  success: boolean;
  errors: Record<string, string[]>;
};

export type FormuHandler = (params: FormuCallback) => void;

interface FormuValidationHelpers {
  get: (ref: string) => string;
  args: string[];
}

interface FormuInput {
  ref?: string;
  label: string;
  type: string;
  value?: string;
  validations?: string[];
  component?: string;
  placeholder?: string;
}

type Component = (props: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  config: FormuInput;
  errors: string[] | undefined;
}) => JSX.Element;

interface FormuStore {
  _inputs: (FormuInput & {
    _value?: string;
    _onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  })[];
  load: (inputs: FormuInput[]) => void;
  helpers?: FormuValidationHelpers;
  validators: Record<
    string,
    (value: string, helpers: FormuValidationHelpers) => boolean
  >;
  components: Record<string, Component>;
  check: () => FormuCallback;
  errors: Record<string, string[]>;
  success: boolean;
}

const useStore = create(
  immer<FormuStore>((set, get) => ({
    _inputs: [],
    validators: {},
    components: {
      __default: ({ value, onChange, config }) => (
        <div className="formu__default">
          <label>{config.label}</label>
          <input
            type={config.type}
            value={config.type === "submit" ? config.label : value}
            onChange={onChange}
            placeholder={config.placeholder || ""}
          />
        </div>
      ),
    },
    helpers: {
      get: (ref) => {
        const input = get()._inputs.find((input) => input.ref === ref);
        if (!input) {
          throw new Error(`No input found with ref: ${ref}`);
        }
        return input._value!;
      },
      args: [],
    },
    load: (inputs) => {
      set((state) => {
        state.success = false;
        state._inputs = inputs.map((input, i) => ({
          ...input,
          _value: input.value || "",
          _onChange: (e) => {
            set((s) => {
              s._inputs[i]._value = e.target.value;
            });
          },
        }));
      });
    },
    check: () => {
      const { _inputs } = get();
      const errors: Record<string, string[]> = {};
      _inputs.forEach((input) => {
        if (input.validations) {
          errors[input.label] = [];
          input.validations.forEach((validation) => {
            const [name, ...args] = validation.split(":");
            if (
              !get().validators[name](input._value!, {
                ...get().helpers!,
                args,
              })
            )
              errors[input.label].push(name);
          });
        }
      });

      const success =
        Object.values(errors).every((error) => error.length === 0) &&
        _inputs.length > 0;

      set((state) => {
        state.errors = errors;
        state.success = success;
      });

      return {
        data: _inputs.reduce((acc, input) => {
          acc[input.label] = input._value!;
          return acc;
        }, {} as Record<string, string>),
        errors,
        success,
      };
    },
    errors: {},
    success: false,
  }))
);

interface Validators {
  [key: string]: (value: string, helpers: FormuValidationHelpers) => boolean;
}

const addValidators = (validators: Validators) => {
  useStore.setState((state) => {
    state.validators = { ...state.validators, ...validators };
  });
};

const addComponents = (components: Record<string, Component>) => {
  useStore.setState((state) => {
    state.components = { ...state.components, ...components };
  });
};

const Formu = ({
  onSubmit,
  inputs,
}: {
  onSubmit: FormuHandler;
  inputs: FormuInput[];
}) => {
  const { load, check, _inputs, components, errors } = useStore();

  useEffect(() => {
    if (load) load(inputs);
  }, [JSON.stringify(inputs), load]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(check());
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        {_inputs.map((input, i) => (
          <div key={i}>
            {components[input.component ?? "__default"]({
              value: input._value!,
              onChange: input._onChange!,
              config: input,
              errors: errors[input.label],
            })}
          </div>
        ))}
      </form>
    </>
  );
};

export { Formu, addValidators, addComponents };
