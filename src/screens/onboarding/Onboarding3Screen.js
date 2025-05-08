import React from "react";
import OnboardingTemplate from "../../components/OnboardingTemplate";

const Onboarding3Screen = ({ navigation }) => {
  return (
    <OnboardingTemplate
      imageSource={require("../../../assets/images/onboarding3_picnic.png")}
      title="Transform Your Health and Wellness Journey Today"
      primaryButtonText="Login"
      secondaryButtonText="Create New Account"
      onPrimaryPress={() => navigation.navigate("Login")}
      onSecondaryPress={() => navigation.navigate("SignUp1")}
    />
  );
};

export default Onboarding3Screen;
