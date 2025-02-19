import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  // Your Firebase config here
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export async function fetchHotspotData(countryCode: string) {
  try {
    // First get the country document
    const countryDocRef = doc(db, 'hotspots', countryCode);
    const countrySnapshot = await getDoc(countryDocRef);
    
    if (!countrySnapshot.exists()) {
      throw new Error(`No data found for country ${countryCode}`);
    }

    // Then get all regions for this country
    const regionsRef = collection(db, `hotspots/${countryCode}/regions`);
    const regionsSnapshot = await getDocs(regionsRef);
    
    const regions = regionsSnapshot.docs.map(regionDoc => ({
      name: regionDoc.data().name,
      vulnerability: regionDoc.data().vulnerability,
      womenInAgriculture: regionDoc.data().womenInAgriculture,
      latitude: regionDoc.data().latitude,
      longitude: regionDoc.data().longitude,
      riskFactors: regionDoc.data().riskFactors
    }));

    return {
      country: countrySnapshot.data().countryName,
      countryCode,
      regions
    };
  } catch (error) {
    console.error("Error fetching hotspot data:", error);
    throw error;
  }
}