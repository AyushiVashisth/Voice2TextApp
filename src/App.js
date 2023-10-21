import React, { useState, useEffect } from "react";
import SpeechRecognition, {
  useSpeechRecognition
} from "react-speech-recognition";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { BsFillMicFill } from "react-icons/bs";

const App = () => {
  // Define the form fields
  const fields = [
    "firstName",
    "lastName",
    "state",
    "district",
    "village",
    "panNumber",
    "aadhaarNumber"
  ];

  // State variables to manage form data and recording
  const [transcribedText, setTranscribedText] = useState({});
  const [activeField, setActiveField] = useState(""); // Tracks the field currently being recorded
  const [recordingTranscript, setRecordingTranscript] = useState(""); // Stores the live recording transcript
  const [isSubmitDisabled, setSubmitDisabled] = useState(true); // Track the submit button's disabled state

  const { transcript, resetTranscript, finalTranscript, listening } =
    useSpeechRecognition(); // Hook for speech recognition

  // Function to toggle recording for a specific field
  const handleToggleRecording = (field) => {
    if (activeField === field) {
      // Stop recording and update the transcribed text when recording ends
      setActiveField("");
      const cleanedTranscript = finalTranscript || transcript;
      const updatedTranscript = cleanedTranscript.endsWith(".")
        ? cleanedTranscript.slice(0, -1)
        : cleanedTranscript;
      setTranscribedText((prev) => ({ ...prev, [field]: updatedTranscript }));
      resetTranscript();
      setRecordingTranscript("");
      SpeechRecognition.stopListening();
    } else {
      // Start recording for the selected field
      setActiveField(field);
      setRecordingTranscript("");
      SpeechRecognition.startListening({ continuous: true });
    }
  };

  // Function to handle changes in the Aadhaar Number input field
  const handleAadharNumberChange = (e) => {
    const inputValue = e.target.value;
    const numericValue = inputValue.replace(/[^0-9]/g, ""); // Remove non-numeric characters
    if (numericValue.length <= 12) {
      setTranscribedText((prev) => ({
        ...prev,
        aadhaarNumber: numericValue
      }));
    }
  };

  // Function to handle form submission
  const handleSubmit = () => {
    const filledFields = [];
    for (const key in transcribedText) {
      filledFields.push(key);
    }

    const unfilledFields = fields.filter(
      (field) => !filledFields.includes(field)
    );

    const aadharNumber = transcribedText["aadhaarNumber"];
    if (unfilledFields.length === 0) {
      if (aadharNumber.length !== 12) {
        // Display an error if Aadhar Number is not exactly 12 digits
        toast.error("Aadhar Number should be exactly 12 digits.");
      } else {
        // If all fields are filled and Aadhar Number is valid, submit the form
        const formData = { ...transcribedText };
        axios
          .post(
            "https://onefinitylabsapi.onrender.com/onefinitylabsApi",
            formData
          )
          .then((response) => {
            console.log("Form data submitted successfully:", response.data);
            toast.success("Form data submitted successfully");
            // Reset the form after submission
            setTranscribedText({});
            setSubmitDisabled(true);
          })
          .catch((error) => {
            console.error("Error submitting form data:", error);
            toast.error("Error submitting form data");
          });
      }
    } else {
      // Display an error if some fields are unfilled
      const unfilledFieldNames = unfilledFields.join(", ");
      toast.error(
        `Please fill out the following fields: ${unfilledFieldNames}`
      );
    }
  };

  // Enable/disable the "Submit" button based on form completion
  useEffect(() => {
    const filledFields = Object.values(transcribedText).filter(Boolean);
    const isAadharValid =
      transcribedText["aadhaarNumber"] &&
      transcribedText["aadhaarNumber"].length === 12;

    setSubmitDisabled(filledFields.length !== fields.length || !isAadharValid);
  }, [transcribedText]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-500 to-yellow-500 flex flex-col justify-center items-center">
      <div className="w-full md:w-2/3 lg:w-1/2 xl:w-1/3 border border-gray-300 rounded-l-md shadow-md p-6">
        <h1 className="text-3xl font-bold mb-6 text-center">Form</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 ">
          {fields.map((field, index) => (
            <div key={index} className="flex items-center">
              <div className="flex flex-col w-full">
                <div className="flex justify-between items-center mt-2">
                  <label className="text-black font-semibold">
                    {field}
                    <span className="text-red-900">*</span>
                  </label>
                  <h4 className="text-gray-200">
                    {activeField === field && listening
                      ? "   recording..."
                      : ""}
                  </h4>
                </div>
                <input
                  type={field === "aadhaarNumber" ? "number" : "text"}
                  placeholder={field}
                  value={transcribedText[field] || ""}
                  onChange={(e) => {
                    if (field === "aadhaarNumber") {
                      handleAadharNumberChange(e);
                    } else {
                      setTranscribedText((prev) => ({
                        ...prev,
                        [field]: e.target.value
                      }));
                    }
                  }}
                  className="border border-gray-300 rounded-l-md px-4 py-2 w-full shadow-md"
                  required
                />
              </div>
              <button
                onClick={() => handleToggleRecording(field)}
                className={`${
                  activeField === field ? "bg-white" : "bg-blue-500"
                } hover:bg-blue-700 text-white rounded-r-md px-3 py-2 relative group shadow-md top-4`}
              >
                <div className="flex items-center">
                  <div className="mr-2">
                    {activeField === field ? (
                      <BsFillMicFill className="text-green-500 w-6 h-7" />
                    ) : (
                      <BsFillMicFill className="text-white w-6 h-7" />
                    )}
                  </div>
                  <span className="tooltiptext absolute bg-black text-white text-xs py-2 px-3 rounded -left-24 -top-10 w-36 opacity-0 group-hover:opacity-100 transition-opacity">
                    {activeField === field
                      ? "Stop Recording"
                      : "Tap to start recording"}
                    <span className="absolute w-3 h-3 bg-black transform rotate-45 translate-y-1 -translate-x-2 -bottom-1 -right-1 top-5"></span>
                  </span>
                </div>
              </button>
            </div>
          ))}
        </div>
        {activeField && listening && (
          <div className="mt-4">
            <div className="text-xl font-semibold">
              Live Recording Transcript:
            </div>
            <div className="border border-gray-300 rounded p-2 mt-2 shadow-md">
              {transcript}
            </div>
          </div>
        )}

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          className={`${
            isSubmitDisabled
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-700"
          } text-white font-bold py-2 px-4 rounded mt-4 shadow-md w-full`}
          disabled={isSubmitDisabled}
        >
          Submit
        </button>

        <ToastContainer />
      </div>
    </div>
  );
};

export default App;
