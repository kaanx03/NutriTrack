// src/context/ActivityContext.js - Tam Güncellenmiş Hali
import React, { createContext, useState, useContext, useEffect } from "react";
import { useSignUp } from "./SignUpContext";

// Başlangıç değerleri
const initialState = {
  burnedCalories: 0,
  activities: [], // Kullanıcının eklediği tüm aktiviteleri tutar
  favoriteActivities: [], // Favori aktiviteleri sakla
  recentActivities: [], // Son görüntülenen aktiviteleri sakla
  personalActivities: [], // Kullanıcının eklediği özel aktiviteleri sakla
};

const ActivityContext = createContext(initialState);

export const ActivityProvider = ({ children }) => {
  const { formData } = useSignUp();
  const [state, setState] = useState(initialState);

  // Aktivite ekleme/güncelleme fonksiyonu
  const addActivity = (activity) => {
    const {
      id,
      name,
      calories,
      duration = 30,
      type = "Cardio",
      intensity = "Moderate",
    } = activity;

    // Benzersiz ID kullan
    const activityId = id || Date.now().toString();

    setState((prevState) => {
      // Eğer aynı ID ile bir aktivite zaten varsa (güncelleme işlemi)
      const existingIndex = prevState.activities.findIndex(
        (act) => act.id === activityId
      );

      if (existingIndex !== -1) {
        // Güncelleme işlemi
        const oldCalories = prevState.activities[existingIndex].calories;
        const caloriesDifference = calories - oldCalories;

        // Yeni aktiviteler dizisi oluştur
        const newActivities = [...prevState.activities];
        newActivities[existingIndex] = {
          ...activity,
          id: activityId,
          name,
          calories,
          duration,
          type,
          intensity,
          addedAt: prevState.activities[existingIndex].addedAt, // Eski ekleme tarihini koru
        };

        return {
          ...prevState,
          burnedCalories: prevState.burnedCalories + caloriesDifference,
          activities: newActivities,
        };
      }

      // Yeni ekleme işlemi
      const newActivity = {
        id: activityId,
        name,
        calories,
        duration,
        type,
        intensity,
        addedAt: new Date().toISOString(),
      };

      // Toplam yakılan kalori
      const newBurnedCalories = prevState.burnedCalories + calories;

      return {
        ...prevState,
        burnedCalories: newBurnedCalories,
        activities: [...prevState.activities, newActivity],
      };
    });
  };

  // Basit kalori yakma fonksiyonu (belirli bir kalori değeri için)
  const burnCalories = (calories) => {
    setState((prevState) => ({
      ...prevState,
      burnedCalories: prevState.burnedCalories + calories,
    }));
  };

  // Favori aktivite ekleme/çıkarma fonksiyonu
  const toggleFavoriteActivity = (activity) => {
    setState((prevState) => {
      // Aktivite zaten favorilerde mi kontrol et
      const isFavorite = prevState.favoriteActivities.some(
        (item) => item.id === activity.id
      );

      if (isFavorite) {
        // Favorilerden çıkar
        return {
          ...prevState,
          favoriteActivities: prevState.favoriteActivities.filter(
            (item) => item.id !== activity.id
          ),
        };
      } else {
        // Favorilere ekle
        return {
          ...prevState,
          favoriteActivities: [...prevState.favoriteActivities, activity],
        };
      }
    });
  };

  // Son görüntülenen aktivite ekleme fonksiyonu
  const addToRecentActivity = (activity) => {
    setState((prevState) => {
      // Eğer aktivite zaten varsa listeden çıkar (sonra başa eklemek için)
      const filteredRecents = prevState.recentActivities.filter(
        (item) => item.id !== activity.id
      );

      // Aktiviteyi listenin başına ekle ve en fazla 10 aktivite tut
      const updatedRecents = [activity, ...filteredRecents].slice(0, 10);

      return {
        ...prevState,
        recentActivities: updatedRecents,
      };
    });
  };

  // Kişisel aktivite ekleme fonksiyonu
  const addPersonalActivity = (activity) => {
    setState((prevState) => {
      // Eğer aynı ID'ye sahip bir aktivite varsa güncelle, yoksa ekle
      const existingIndex = prevState.personalActivities.findIndex(
        (item) => item.id === activity.id
      );

      let updatedPersonalActivities;
      if (existingIndex >= 0) {
        updatedPersonalActivities = [...prevState.personalActivities];
        updatedPersonalActivities[existingIndex] = activity;
      } else {
        updatedPersonalActivities = [...prevState.personalActivities, activity];
      }

      return {
        ...prevState,
        personalActivities: updatedPersonalActivities,
      };
    });
  };

  // Kişisel aktivite silme fonksiyonu
  const deletePersonalActivity = (activityId) => {
    setState((prevState) => ({
      ...prevState,
      personalActivities: prevState.personalActivities.filter(
        (activity) => activity.id !== activityId
      ),
    }));
  };

  // Aktivite silme fonksiyonu
  const deleteActivity = (activityId) => {
    setState((prevState) => {
      // Silinecek aktiviteyi bul
      const activityToDelete = prevState.activities.find(
        (activity) => activity.id === activityId
      );

      if (!activityToDelete) return prevState;

      // Yakılan kaloriyi güncelle
      const newBurnedCalories = Math.max(
        0,
        prevState.burnedCalories - activityToDelete.calories
      );

      return {
        ...prevState,
        burnedCalories: newBurnedCalories,
        activities: prevState.activities.filter(
          (activity) => activity.id !== activityId
        ),
      };
    });
  };

  return (
    <ActivityContext.Provider
      value={{
        ...state,
        addActivity,
        burnCalories,
        toggleFavoriteActivity,
        addToRecentActivity,
        addPersonalActivity,
        deletePersonalActivity,
        deleteActivity,
      }}
    >
      {children}
    </ActivityContext.Provider>
  );
};

export const useActivity = () => useContext(ActivityContext);
