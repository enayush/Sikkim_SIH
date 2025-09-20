import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // Navigation
      home: 'Home',
      search: 'Search',
      profile: 'Profile',
      map: 'Map',
      contribute: 'Contribute',
      
      // Home Screen
      monasteries: 'Monasteries',
      cardView: 'Card View',
      listView: 'List View',
      searchPlaceholder: 'Search monasteries...',
      
      // Filters
      filters: 'Filters',
      all: 'All',
      nearby: 'Nearby',
      ancient: 'Ancient',
      festivals: 'Festivals',
      allEras: 'All Eras',
      allLocations: 'All Locations',
      clearFilters: 'Clear Filters',
      
      // Monastery Details
      history: 'History',
      culturalSignificance: 'Cultural Significance',
      reviews: 'Reviews',
      writeReview: 'Write Review',
      rating: 'Rating',
      comment: 'Comment',
      submit: 'Submit',
      cancel: 'Cancel',
      
      // Auth
      login: 'Login',
      logout: 'Logout',
      signUp: 'Sign Up',
      email: 'Email',
      password: 'Password',
      forgotPassword: 'Forgot Password?',
      noAccount: "Don't have an account?",
      haveAccount: 'Already have an account?',
      
      // Common
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      retry: 'Retry',
    },
  },
  hi: {
    translation: {
      // Navigation
      home: 'घर',
      search: 'खोजें',
      profile: 'प्रोफाइल',
      map: 'नक्शा',
      contribute: 'योगदान दें',
      
      // Home Screen
      monasteries: 'मठ',
      cardView: 'कार्ड व्यू',
      listView: 'लिस्ट व्यू',
      searchPlaceholder: 'मठों को खोजें...',
      
      // Filters
      filters: 'फिल्टर',
      all: 'सभी',
      nearby: 'आस-पास',
      ancient: 'प्राचीन',
      festivals: 'त्योहार',
      allEras: 'सभी युग',
      allLocations: 'सभी स्थान',
      clearFilters: 'फिल्टर साफ़ करें',
      
      // Monastery Details
      history: 'इतिहास',
      culturalSignificance: 'सांस्कृतिक महत्व',
      reviews: 'समीक्षाएं',
      writeReview: 'समीक्षा लिखें',
      rating: 'रेटिंग',
      comment: 'टिप्पणी',
      submit: 'जमा करें',
      cancel: 'रद्द करें',
      
      // Auth
      login: 'लॉगिन',
      logout: 'लॉगआउट',
      signUp: 'साइन अप',
      email: 'ईमेल',
      password: 'पासवर्ड',
      forgotPassword: 'पासवर्ड भूल गए?',
      noAccount: 'खाता नहीं है?',
      haveAccount: 'पहले से खाता है?',
      
      // Common
      loading: 'लोड हो रहा है...',
      error: 'त्रुटि',
      success: 'सफलता',
      retry: 'पुनः प्रयास',
    },
  },
  ne: {
    translation: {
      // Navigation
      home: 'घर',
      search: 'खोज',
      profile: 'प्रोफाइल',
      map: 'नक्सा',
      contribute: 'योगदान दिनुहोस्',

      // Home Screen
      monasteries: 'मठहरू',
      cardView: 'कार्ड दृश्य',
      listView: 'सूची दृश्य',
      searchPlaceholder: 'मठहरू खोज्नुहोस्...',
      
      // Filters
      filters: 'फिल्टरहरू',
      allEras: 'सबै युगहरू',
      allLocations: 'सबै स्थानहरू',
      clearFilters: 'फिल्टरहरू सफा गर्नुहोस्',
      
      // Monastery Details
      history: 'इतिहास',
      culturalSignificance: 'सांस्कृतिक महत्व',
      reviews: 'समीक्षाहरू',
      writeReview: 'समीक्षा लेख्नुहोस्',
      rating: 'मूल्याङ्कन',
      comment: 'टिप्पणी',
      submit: 'पेश गर्नुहोस्',
      cancel: 'रद्द गर्नुहोस्',
      
      // Auth
      login: 'लगइन',
      logout: 'लगआउट',
      signUp: 'साइन अप',
      email: 'इमेल',
      password: 'पासवर्ड',
      forgotPassword: 'पासवर्ड बिर्सनुभयो?',
      noAccount: 'खाता छैन?',
      haveAccount: 'पहिले नै खाता छ?',
      
      // Common
      loading: 'लोड हुँदैछ...',
      error: 'त्रुटि',
      success: 'सफलता',
      retry: 'पुनः प्रयास',
    },
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;