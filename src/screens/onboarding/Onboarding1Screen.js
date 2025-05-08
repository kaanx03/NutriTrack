import React from "react";
import OnboardingTemplate from "../../components/OnboardingTemplate";

const Onboarding1Screen = ({ navigation }) => {
  return (
    <OnboardingTemplate
      imageSource={require("../../../assets/images/onboarding1_boat.png")}
      title="Help your path to health goals with happiness"
      primaryButtonText="Next"
      secondaryButtonText="Skip"
      onPrimaryPress={() => navigation.navigate("Onboarding2")}
      onSecondaryPress={() => navigation.navigate("Onboarding3")}
    />
  );
};

export default Onboarding1Screen;
