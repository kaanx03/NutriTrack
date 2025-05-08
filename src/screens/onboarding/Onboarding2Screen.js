import React from "react";
import OnboardingTemplate from "../../components/OnboardingTemplate";

const Onboarding2Screen = ({ navigation }) => {
  return (
    <OnboardingTemplate
      imageSource={require("../../../assets/images/onboarding2_hiking.png")}
      title="Achieve Your Fitness Goals Effortlessly"
      primaryButtonText="Next"
      secondaryButtonText="Skip"
      onPrimaryPress={() => navigation.navigate("Onboarding3")}
      onSecondaryPress={() => navigation.navigate("Onboarding3")}
    />
  );
};

export default Onboarding2Screen;
