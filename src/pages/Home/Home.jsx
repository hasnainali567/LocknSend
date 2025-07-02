import React, { useState, useRef, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  TextArea,
  Button,
  Dropzone,
  FileList,
  PopUp,
  PasswordPopup,
} from "../../components";
import { Popover } from "antd";
import Lottie from "lottie-react";
import CryptoJS from "crypto-js";
import {
  db,
  doc,
  onSnapshot,
  collection,
  setDoc,
  updateDoc,
  getDocs,
  getDoc,
  arrayUnion,
} from "../../config/firebaseConfig.js";
import Text_Grey from "../../assets/text-grey.svg";
import Text_Color from "../../assets/text-color.svg";
import File_Grey from "../../assets/files-grey.svg";
import File_Color from "../../assets/files-color.svg";
import CheckedAnimation from "../../assets/lottie/Animation - 1751384305932.json";
import { FaPlus } from "react-icons/fa6";

import "./style.scss";
import { addDoc } from "firebase/firestore";

const Home = () => {
  const [type, setType] = useState("text");
  const [value, setValue] = useState("");
  const [file, setfile] = useState([]);
  const [urls, setUrls] = useState([]);
  const [btnText, setBtnText] = useState("Save");
  const [savePopup, setSavePopup] = useState(false);
  const [shareableUrl, setShareableUrl] = useState("");
  const [hasSavedBefore, setHasSavedBefore] = useState(false);
  const [popoverContent, setPopoverContent] = useState("Copy the Url");
  const [passwordPopupOpen, setPasswordPopupOpen] = useState(false);
  const [initialEncryptedText, setInitialEncryptedText] = useState(null);
  const [startListening, setStartListening] = useState(false);
  const passRef = useRef(null);
  const docIdRef = useRef(null);
  const textAreaRef = useRef(null);
  const popupSaveRef = useRef(null);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");
  const isProtected = searchParams.get("protected");

  useEffect(() => {
    if (!isProtected || !id) return;

    async function fetchProtectedData() {
      try {
        setPasswordPopupOpen(true); // show popup
        const docSnap = await getDoc(doc(db, "text", id));
        if (docSnap.exists()) {
          setInitialEncryptedText(docSnap.data().text);
          docIdRef.current = id;
          setShareableUrl(`${window.location.origin}/?id=${id}&protected=true`);
        }
      } catch (e) {
        console.error("Failed to fetch encrypted doc:", e);
      }
    }

    fetchProtectedData();
  }, [isProtected]);

  useEffect(() => {
    if (isProtected || !id) return;
    if (id) {
      setHasSavedBefore(true);
      docIdRef.current = id;
      setShareableUrl(`${window.location.origin}/?id=${docIdRef.current}`);
    }
  }, [id, isProtected]);

  async function checkIfCollectionExists(collectionName) {
    const querySnapshot = await getDocs(collection(db, collectionName));
    return !querySnapshot.empty;
  }

  const saveTextBtn = async () => {
    if (!hasSavedBefore) {
      setSavePopup(true);
      return;
    }
    if (btnText === "Save") {
      try {
        setBtnText("Saving...");
        const urls = extractUrls(value);
        setUrls([...new Set(urls)]);
        let docId = docIdRef.current;

        if (passRef.current !== null) {
          let encryptedText = secureEncrypt(value, passRef.current);
          await updateDoc(doc(db, "text", docId), {
            text: encryptedText,
          });
        } else {
          await updateDoc(doc(db, "text", docId), {
            text: value,
          });
        }

        setBtnText("Copy");
      } catch (error) {
        setBtnText('Save')
      }
    } else if (btnText === "Copy") {
      textAreaRef.current.select();
      window.navigator.clipboard.writeText(textAreaRef.current.value);
    }
  };

  useEffect(() => {
    if (!docIdRef.current || isProtected) return;
    const docRef = doc(db, "text", docIdRef.current);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        let text = docSnap.data().text;
        setValue(text);
        let urls = extractUrls(text);
        setUrls([...new Set(urls)]);
        setBtnText("Copy");
      }
    });
    return () => unsubscribe();
  }, [docIdRef.current]);

  useEffect(() => {
    if (!startListening) return;
    const docRef = doc(db, "text", docIdRef.current);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        let text = docSnap.data().text;
        let decrypted = secureDecrypt(text, passRef.current);
        setValue(decrypted);
        setUrls([...new Set(extractUrls(decrypted))]);
        setBtnText("Copy");
      }
    });
    return () => unsubscribe();
  }, [startListening]);

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.readAsDataURL(file); // 👈 This converts it to base64

      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const onDrop = async (acceptedFiles) => {
    const base64Files = await Promise.all(
      acceptedFiles.map(async (file) => {
        const base64 = await convertToBase64(file);
        return {
          name: file.name,
          type: file.type,
          size: file.size,
        };
      })
    );

    setfile((prev) => [...prev, ...base64Files]);

    const docRef = doc(db, "files", "shared");
    const isDocExist = await checkIfCollectionExists("files");

    if (isDocExist) {
      await updateDoc(docRef, {
        file: arrayUnion(...base64Files), // spread the array here
      });
    } else {
      await setDoc(docRef, {
        file: base64Files, // this should be a flat array of pure objects
      });
    }
  };

  useEffect(() => {
    if (type !== "file") return;

    const unsub = onSnapshot(doc(db, "files", "shared"), (docSnap) => {
      if (docSnap.exists()) {
        setfile(docSnap.data().file || []);
        console.log(file);
      }
    });

    return () => unsub();
  }, [type]);

  const clearText = async () => {
    setBtnText("Saving...");
    setValue("");
    let isDocExist = await checkIfCollectionExists("text");
    let docId = docIdRef.current;

    if (isDocExist) {
      await updateDoc(doc(db, "text", docId), {
        text: "",
      });

      setBtnText("Save");
      setUrls([]);
    }
  };

  const extractUrls = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.match(urlRegex) || [];
  };

  async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return hashHex;
  }

  const onPopupSave = async (password) => {
    if (password !== "") {
      console.log(password);
      let encryptedText = secureEncrypt(value, password);

      let docRef = await addDoc(collection(db, "text"), {
        text: encryptedText,
      });

      docIdRef.current = docRef.id;
      passRef.current = password;
      setShareableUrl(
        `${window.location.origin}/?id=${docIdRef.current}&protected=true`
      );
    } else {
      let docRef = await addDoc(collection(db, "text"), {
        text: value,
      });

      docIdRef.current = docRef.id;
      setShareableUrl(`${window.location.origin}/?id=${docIdRef.current}`);
    }

    setBtnText("Copy");
    setHasSavedBefore(true);
    setSavePopup(false);
  };

  function secureEncrypt(text, password) {
    const salt = CryptoJS.lib.WordArray.random(128 / 8);

    const key = CryptoJS.PBKDF2(password, salt, {
      keySize: 256 / 32, // 256-bit key
      iterations: 10000, // 10x more secure than default
    });

    const iv = CryptoJS.lib.WordArray.random(128 / 8);

    const encrypted = CryptoJS.AES.encrypt(text, key, {
      iv: iv,
      padding: CryptoJS.pad.Pkcs7,
      mode: CryptoJS.mode.CBC,
    });

    return [
      encrypted.toString(), // Base64 ciphertext
      salt.toString(), // Hex salt
      iv.toString(), // Hex IV
    ].join("|");
  }

  function secureDecrypt(encryptedData, password) {
    try {
      const [ciphertext, saltHex, ivHex] = encryptedData.split("|");

      const salt = CryptoJS.enc.Hex.parse(saltHex);
      const iv = CryptoJS.enc.Hex.parse(ivHex);

      const key = CryptoJS.PBKDF2(password, salt, {
        keySize: 256 / 32, // 256-bit key
        iterations: 10000, // Must match encryption iterations
        hasher: CryptoJS.algo.SHA256,
      });

      const decrypted = CryptoJS.AES.decrypt(ciphertext, key, {
        iv: iv,
        padding: CryptoJS.pad.Pkcs7,
        mode: CryptoJS.mode.CBC,
      });
      const plaintext = decrypted.toString(CryptoJS.enc.Utf8);

      if (!plaintext) {
        throw new Error("Invalid password");
      }

      return plaintext;
    } catch (error) {
      console.error("Decryption failed:", error);
      throw new Error("Invalid password or corrupted data");
    }
  }

  const handlePasswordSubmit = async (enteredPassword) => {
    try {
      secureDecrypt(initialEncryptedText, enteredPassword);
      passRef.current = enteredPassword;
      setStartListening(true);
      setHasSavedBefore(true);
      setPasswordPopupOpen(false);
    } catch (e) {
      alert("Incorrect password, try again.");
    }
  };

  const copyUrl = () => {
    setPopoverContent("animation");
    window.navigator.clipboard.writeText(shareableUrl);

    setTimeout(() => {
      setPopoverContent("Copy the Url");
    }, 2000);
  };

  return (
    <div className='main-container min-h-120 bg-white shadow-2xl flex mb-10 relative'>
      <PopUp
        open={savePopup}
        onClose={() => setSavePopup(false)}
        onSave={(password) => onPopupSave(password)}
        ref={popupSaveRef}
      />
      <PasswordPopup
        open={passwordPopupOpen}
        onSubmit={(password) => handlePasswordSubmit(password)}
      />
      <div className='left-section min-h-120 bg-gray-100'>
        <div
          className={type === "text" ? "switcher active" : "switcher"}
          onClick={() => setType("text")}
        >
          <img src={type === "text" ? Text_Color : Text_Grey} alt='' />
        </div>
        <div
          className={type === "file" ? "switcher active" : "switcher"}
          onClick={() => setType("file")}
        >
          <img src={type === "file" ? File_Color : File_Grey} alt='' />
        </div>
      </div>
      {type === "text" ? (
        <div className='right-section'>
          <div className='flex justify-between'>
            <h1>Text</h1>
            {docIdRef.current !== null ? (
              <div className='px-5'>
                <p className='text-md text-gray-600'>
                  Share this URL with any one:{" "}
                  <Popover
                    style={{ padding: "7px" }}
                    content={
                      popoverContent === "animation" ? (
                        <div className='px-6.5'>
                          <Lottie
                            animationData={CheckedAnimation}
                            loop={false}
                            style={{ width: 38, height: 38 }}
                          />
                        </div>
                      ) : (
                        <button
                          className='hover:bg-gray-100 p-2 rounded-lg font-medium'
                          onClick={copyUrl}
                        >
                          {popoverContent}
                        </button>
                      )
                    }
                    trigger='hover'
                  >
                    <span className='text-blue-500 cursor-pointer hover:underline text-blue-600'>
                      {shareableUrl}
                    </span>
                  </Popover>
                </p>
                {passRef.current !== null ? (
                  <p className='text-md text-gray-400'>
                    Also Share the Password
                  </p>
                ) : (
                  ""
                )}
              </div>
            ) : (
              ""
            )}
          </div>
          <TextArea
            ref={textAreaRef}
            value={value}
            onChangeText={(value) => {
              setValue(value);
              setBtnText("Save");
            }}
          />
          <div className='w-full flex justify-end py-4 gap-15'>
            {value === "" ? (
              ""
            ) : (
              <button className='px-5 cursor-pointer' onClick={clearText}>
                clear
              </button>
            )}
            <Button
              onClick={() => {
                saveTextBtn();
              }}
              disable={value === "" ? true : false}
              children={btnText}
            />
          </div>
          {urls.length > 0 ? (
            <div className='urls-container p-4 flex flex-col gap-1'>
              {urls.length
                ? urls.map((url, i) => (
                    <a key={i} href={url} target='_blank'>
                      {url}
                    </a>
                  ))
                : ""}
            </div>
          ) : (
            ""
          )}
        </div>
      ) : (
        <div className='right-section'>
          <h1>Files</h1>
          {file.length ? (
            <div className='withFiles flex flex-wrap'>
              <FileList files={file} onDrop={onDrop} />
              <Dropzone
                onDrop={onDrop}
                className='dropzone'
                title={
                  <div className='dropzone-text'>
                    <FaPlus />
                    <div>
                      <span>Add File</span>
                      <span>(upto 5 Mb )</span>
                    </div>
                  </div>
                }
              />
            </div>
          ) : (
            <Dropzone
              className='dropzone'
              onDrop={(file) => {
                onDrop(file);
              }}
              title={
                <p>
                  Drag and drop any files up to 2 files, 5Mbs each or{" "}
                  <span className=''>Browse Upgrade</span> to get more space
                </p>
              }
            />
          )}
        </div>
      )}
    </div>
  );
};

export default Home;
