export type Locale={code:string;nativeName:string;englishName:string;direction:'ltr'|'rtl'};
export const locales:Locale[]=[
{code:'en',nativeName:'English',englishName:'English',direction:'ltr'},
{code:'hi',nativeName:'हिन्दी',englishName:'Hindi',direction:'ltr'},
{code:'bn',nativeName:'বাংলা',englishName:'Bengali',direction:'ltr'},
{code:'mr',nativeName:'मराठी',englishName:'Marathi',direction:'ltr'},
{code:'ta',nativeName:'தமிழ்',englishName:'Tamil',direction:'ltr'},
{code:'te',nativeName:'తెలుగు',englishName:'Telugu',direction:'ltr'},
{code:'gu',nativeName:'ગુજરાતી',englishName:'Gujarati',direction:'ltr'},
{code:'kn',nativeName:'ಕನ್ನಡ',englishName:'Kannada',direction:'ltr'},
{code:'ml',nativeName:'മലയാളം',englishName:'Malayalam',direction:'ltr'},
{code:'pa',nativeName:'ਪੰਜਾਬੀ',englishName:'Punjabi',direction:'ltr'},
{code:'ur',nativeName:'اردو',englishName:'Urdu',direction:'rtl'},
{code:'as',nativeName:'অসমীয়া',englishName:'Assamese',direction:'ltr'},
{code:'or',nativeName:'ଓଡ଼ିଆ',englishName:'Odia',direction:'ltr'},
{code:'ne',nativeName:'नेपाली',englishName:'Nepali',direction:'ltr'},
{code:'sa',nativeName:'संस्कृतम्',englishName:'Sanskrit',direction:'ltr'},
{code:'kok',nativeName:'कोंकणी',englishName:'Konkani',direction:'ltr'},
{code:'mai',nativeName:'मैथिली',englishName:'Maithili',direction:'ltr'},
{code:'bho',nativeName:'भोजपुरी',englishName:'Bhojpuri',direction:'ltr'},
{code:'ks',nativeName:'कॉशुर / کٲشُر',englishName:'Kashmiri',direction:'rtl'},
{code:'sd',nativeName:'सिन्धी / سنڌي',englishName:'Sindhi',direction:'rtl'},
{code:'doi',nativeName:'डोगरी',englishName:'Dogri',direction:'ltr'},
{code:'sat',nativeName:'ᱥᱟᱱᱛᱟᱲᱤ',englishName:'Santali',direction:'ltr'},
{code:'mni',nativeName:'ꯃꯤꯇꯩ ꯂꯣꯟ',englishName:'Manipuri',direction:'ltr'},
{code:'ar',nativeName:'العربية',englishName:'Arabic',direction:'rtl'},
{code:'fa',nativeName:'فارسی',englishName:'Persian',direction:'rtl'},
{code:'tr',nativeName:'Türkçe',englishName:'Turkish',direction:'ltr'},
{code:'fr',nativeName:'Français',englishName:'French',direction:'ltr'},
{code:'de',nativeName:'Deutsch',englishName:'German',direction:'ltr'},
{code:'es',nativeName:'Español',englishName:'Spanish',direction:'ltr'},
{code:'pt',nativeName:'Português',englishName:'Portuguese',direction:'ltr'},
{code:'it',nativeName:'Italiano',englishName:'Italian',direction:'ltr'},
{code:'ru',nativeName:'Русский',englishName:'Russian',direction:'ltr'},
{code:'uk',nativeName:'Українська',englishName:'Ukrainian',direction:'ltr'},
{code:'pl',nativeName:'Polski',englishName:'Polish',direction:'ltr'},
{code:'nl',nativeName:'Nederlands',englishName:'Dutch',direction:'ltr'},
{code:'sv',nativeName:'Svenska',englishName:'Swedish',direction:'ltr'},
{code:'ja',nativeName:'日本語',englishName:'Japanese',direction:'ltr'},
{code:'ko',nativeName:'한국어',englishName:'Korean',direction:'ltr'},
{code:'zh',nativeName:'简体中文',englishName:'Chinese (Simplified)',direction:'ltr'},
{code:'zh-TW',nativeName:'繁體中文',englishName:'Chinese (Traditional)',direction:'ltr'},
{code:'th',nativeName:'ไทย',englishName:'Thai',direction:'ltr'},
{code:'vi',nativeName:'Tiếng Việt',englishName:'Vietnamese',direction:'ltr'},
{code:'id',nativeName:'Bahasa Indonesia',englishName:'Indonesian',direction:'ltr'},
{code:'ms',nativeName:'Bahasa Melayu',englishName:'Malay',direction:'ltr'},
{code:'fil',nativeName:'Filipino',englishName:'Filipino',direction:'ltr'},
{code:'sw',nativeName:'Kiswahili',englishName:'Swahili',direction:'ltr'},
{code:'he',nativeName:'עברית',englishName:'Hebrew',direction:'rtl'}
];
export const defaultLocale='en';
const STORAGE_KEY='drustpoll.locale';
export async function loadLocale(){try{const{default:AsyncStorage}=await import('@react-native-async-storage/async-storage');return (await AsyncStorage.getItem(STORAGE_KEY))??defaultLocale;}catch{return defaultLocale;}}
export async function saveLocale(code:string){if(!locales.some(l=>l.code===code))return;const{default:AsyncStorage}=await import('@react-native-async-storage/async-storage');await AsyncStorage.setItem(STORAGE_KEY,code);}
const dictionaries:Record<string,Record<string,string>>={
 en:{welcome:'Welcome',continue:'Continue',create:'Create account',signIn:'Sign in',name:'Name',username:'Username',email:'Email',phone:'Phone',password:'Password',language:'Language',chooseLanguage:'Choose your language',yourWorld:'Your world, naturally.'},
 hi:{welcome:'स्वागत है',continue:'जारी रखें',create:'खाता बनाएँ',signIn:'साइन इन',name:'नाम',username:'यूज़रनेम',email:'ईमेल',phone:'फ़ोन',password:'पासवर्ड',language:'भाषा',chooseLanguage:'अपनी भाषा चुनें',yourWorld:'आपकी दुनिया, स्वाभाविक रूप से।'},
 bn:{welcome:'স্বাগতম',continue:'চালিয়ে যান',create:'অ্যাকাউন্ট তৈরি করুন',signIn:'সাইন ইন',name:'নাম',username:'ইউজারনেম',email:'ইমেল',phone:'ফোন',password:'পাসওয়ার্ড',language:'ভাষা',chooseLanguage:'আপনার ভাষা বেছে নিন',yourWorld:'আপনার জগত, স্বাভাবিকভাবে।'},
 mr:{welcome:'स्वागत आहे',continue:'पुढे जा',create:'खाते तयार करा',signIn:'साइन इन',name:'नाव',username:'वापरकर्तानाव',email:'ईमेल',phone:'फोन',password:'पासवर्ड',language:'भाषा',chooseLanguage:'तुमची भाषा निवडा',yourWorld:'तुमची दुनिया, सहजपणे.'}
};
export function t(locale:string,key:string){return dictionaries[locale]?.[key]??dictionaries[locale]?.[key]??dictionaries.en[key]??key;}
