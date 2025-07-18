import { useReducer, useCallback } from "react";

// =============================
// TIPOS Y INTERFACES
// =============================

export interface AuthFormData {
  email: string;
  firstName: string;
  lastName: string;
  gender: string;
  phone: string;
  code: string;
  selectedPlan: string;
  billingFrequency: string;
  paymentMethod: string;
  otp: string; // Nuevo campo para OTP
}

export interface AuthState {
  currentStep: number;
  userExists: boolean | null;
  formData: AuthFormData;
  isLoading: boolean;
  error: string | null;
}

export type AuthAction =
  | { type: "SET_STEP"; payload: number }
  | { type: "SET_USER_EXISTS"; payload: boolean }
  | { type: "UPDATE_FORM_DATA"; payload: Partial<AuthFormData> }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "RESET_STATE" }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" };

// =============================
// ESTADO INICIAL
// =============================

const initialState: AuthState = {
  currentStep: 1,
  userExists: null,
  formData: {
    email: "",
    firstName: "",
    lastName: "",
    gender: "",
    phone: "",
    code: "",
    selectedPlan: "",
    billingFrequency: "monthly",
    paymentMethod: "",
    otp: "", // Nuevo campo para OTP
  },
  isLoading: false,
  error: null,
};

// =============================
// REDUCER
// =============================

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "SET_STEP":
      return {
        ...state,
        currentStep: action.payload,
        error: null, // Limpiar errores al cambiar paso
      };

    case "SET_USER_EXISTS":
      return {
        ...state,
        userExists: action.payload,
      };

    case "UPDATE_FORM_DATA":
      return {
        ...state,
        formData: {
          ...state.formData,
          ...action.payload,
        },
        error: null, // Limpiar errores al actualizar datos
      };

    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
        error: action.payload ? null : state.error, // Limpiar errores al cargar
      };

    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
        isLoading: false, // Parar carga si hay error
      };

    case "RESET_STATE":
      return initialState;

    case "NEXT_STEP":
      return {
        ...state,
        currentStep: Math.min(state.currentStep + 1, 6), // Ahora son 6 pasos
        error: null,
      };

    case "PREV_STEP":
      return {
        ...state,
        currentStep: Math.max(state.currentStep - 1, 1),
        error: null,
      };

    default:
      return state;
  }
}

// =============================
// HOOK PERSONALIZADO
// =============================

export function useAuthReducer() {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Acciones
  const setStep = useCallback((step: number) => {
    dispatch({ type: "SET_STEP", payload: step });
  }, []);

  const setUserExists = useCallback((exists: boolean) => {
    dispatch({ type: "SET_USER_EXISTS", payload: exists });
  }, []);

  const updateFormData = useCallback((field: string, value: string) => {
    dispatch({
      type: "UPDATE_FORM_DATA",
      payload: { [field]: value } as Partial<AuthFormData>,
    });
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: "SET_LOADING", payload: loading });
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: "SET_ERROR", payload: error });
  }, []);

  const resetState = useCallback(() => {
    dispatch({ type: "RESET_STATE" });
  }, []);

  const nextStep = useCallback(() => {
    dispatch({ type: "NEXT_STEP" });
  }, []);

  const prevStep = useCallback(() => {
    dispatch({ type: "PREV_STEP" });
  }, []);

  // Cálculos derivados
  const totalSteps = state.userExists === null ? 6 : state.userExists ? 2 : 6; // Ahora son 6 pasos para usuarios nuevos
  const progressPercentage = (state.currentStep / totalSteps) * 100;
  const isLastStep = state.currentStep === totalSteps;
  const isFirstStep = state.currentStep === 1;

  const canContinue = useCallback(() => {
    switch (state.currentStep) {
      case 1:
        return (
          state.formData.email.includes("@") &&
          state.formData.email.includes(".")
        );
      case 2:
        if (state.userExists) {
          return state.formData.code.length >= 4;
        } else {
          return (
            state.formData.firstName.trim() &&
            state.formData.lastName.trim() &&
            state.formData.phone.trim()
          );
        }
      case 3:
        return !!state.formData.selectedPlan;
      case 4:
        return !!state.formData.paymentMethod;
      case 5:
        return true; // Confirmación
      case 6:
        return state.formData.otp.length === 6; // OTP debe tener 6 dígitos
      default:
        return false;
    }
  }, [state.currentStep, state.userExists, state.formData]);

  return {
    state,
    setStep,
    setUserExists,
    updateFormData,
    setLoading,
    setError,
    resetState,
    nextStep,
    prevStep,
    totalSteps,
    progressPercentage,
    isLastStep,
    isFirstStep,
    canContinue,
  };
}
