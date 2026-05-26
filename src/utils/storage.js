import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase/config";

/**
 * Uploads a file to Firebase Storage and returns the download URL.
 * 
 * @param {File} file The file to upload.
 * @param {string} path The folder path to store the file in (e.g., "notes/user123").
 * @returns {Promise<string>} The download URL of the uploaded file.
 */
export const uploadFile = async (file, path) => {
  if (!file) return null;
  
  // Create a unique filename to prevent overwrites
  const uniqueFilename = `${Date.now()}_${file.name}`;
  const fullPath = `${path}/${uniqueFilename}`;
  
  const storageRef = ref(storage, fullPath);
  
  try {
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};
