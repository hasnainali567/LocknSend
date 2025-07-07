import React, { useState, useRef, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  TextArea,
  Button,
  Dropzone,
  FileList,
  PopUp,
  PasswordPopup,
  SharedUrl,
} from "../../components";
import { Popover } from "antd";
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
import { message } from "antd";
import { FaPlus } from "react-icons/fa6";
import {
  LuFile,
  LuFiles,
  LuFileStack,
  LuLetterText,
  LuText,
} from "react-icons/lu";

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
  const [messageApi, contextHolder] = message.useMessage();
  const passRef = useRef(null);
  const docIdRef = useRef(null);
  const textAreaRef = useRef(null);
  const popupSaveRef = useRef(null);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");
  const isProtected = searchParams.get("protected");

  useEffect(() => {
    const url = localStorage.getItem("Url");
    if (url) {
      const query = new URL(url, window.location.origin).search;
      localStorage.removeItem("Url");
      navigate(`/${query}`);
    }
  }, []);

  useEffect(() => {
    if (shareableUrl && !id && !isProtected) {
      localStorage.setItem("Url", shareableUrl);
    }
  }, [shareableUrl]);

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

    if (!navigator.onLine) {
      messageApi.destroy();
      messageApi.open({
        type: "error",
        content: "No internet connection!",
      });
      setBtnText("Save");
      return;
    }

    if (btnText === "Save") {
      try {
        messageApi.open({
          type: "loading",
          content: "Saving...",
          duration: 0,
        });
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
        messageApi.destroy();
        messageApi.open({
          type: "success",
          content: "Saved",
        });
        setBtnText("Copy");
      } catch (error) {
        console.log(error);
        setBtnText("Save");
        messageApi.destroy();
        messageApi.open({
          type: "error",
          content: "Something went wrong!",
        });
      }
    } else if (btnText === "Copy") {
      textAreaRef.current.select();
      window.navigator.clipboard.writeText(textAreaRef.current.value);
      messageApi.open({
        type: "success",
        content: "Copied",
      });
    }
  };

  useEffect(() => {
    if (!navigator.onLine) {
      messageApi.destroy();
      messageApi.open({
        type: "error",
        content: "Failed to Load No Internet! ",
      });

      return;
    }
    if (!docIdRef.current || passRef.current || isProtected) return;
    const docRef = doc(db, "text", docIdRef.current);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        let text = docSnap.data().text;
        setValue(text);
        let urls = extractUrls(text);
        setUrls([...new Set(urls)]);
        if (value) {
          setBtnText("Copy");
        }
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
      }
    });

    return () => unsub();
  }, [type]);

  const clearText = async () => {
    let docId = docIdRef.current;

    if (!docId) {
      setValue("");
      setUrls([]);
      setBtnText("Save");
      return;
    }
    if (!navigator.onLine) {
      messageApi.destroy();
      messageApi.open({
        type: "error",
        content: "Failed to clear: No internet connection!",
      });
      return;
    }

    try {
      setBtnText("Saving...");
      messageApi.open({
        type: "loading",
        content: "Saving...",
        duration: 0,
      });

      let isDocExist = await checkIfCollectionExists("text");

      if (isDocExist) {
        await updateDoc(doc(db, "text", docId), {
          text: "",
        });

        setValue("");
        setBtnText("Save");
        setUrls([]);
        messageApi.destroy();
        messageApi.open({
          type: "success",
          content: "Cleared Successfully",
        });
      }
    } catch (error) {
      messageApi.destroy();
      messageApi.open({
        type: "error",
        content: "Error: Text not cleared.",
      });
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
    try {
      if (!navigator.onLine) {
        messageApi.destroy();
        messageApi.open({
          type: "error",
          content: "You're offline! Please connect to the internet to save.",
        });
        return;
      }

      messageApi.destroy();
      messageApi.open({
        type: "loading",
        content: "Saving...",
        duration: 0,
      });

      let encryptedText;
      let docRef;

      if (password !== "") {
        encryptedText = secureEncrypt(value, password);
        docRef = await addDoc(collection(db, "text"), {
          text: encryptedText,
        });

        passRef.current = password;
        setShareableUrl(
          `${window.location.origin}/?id=${docRef.id}&protected=true`
        );
      } else {
        docRef = await addDoc(collection(db, "text"), {
          text: value,
        });

        setShareableUrl(`${window.location.origin}/?id=${docRef.id}`);
      }

      docIdRef.current = docRef.id;

      messageApi.destroy();
      messageApi.open({
        type: "success",
        content: "Saved successfully",
      });

      setBtnText("Copy");
      setHasSavedBefore(true);
      setSavePopup(false);
    } catch (error) {
      console.error("Failed to save:", error);

      messageApi.destroy();
      messageApi.open({
        type: "error",
        content: "Failed to save! Please try again.",
      });
    }
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
      messageApi.destroy();
      messageApi.open({
        type: "error",
        content: "Incorrect Password!",
      });
    }
  };

  const copyUrl = () => {
    window.navigator.clipboard.writeText(shareableUrl);
  };

  return (
    <div className='main-container w-full  min-h-120 flex flex-col mb-10 '>
      <div className='shadow-xl rounded-2xl overflow-hidden relative'>
        {contextHolder}
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
        <div className='left-section flex sticky top-0 left-0 right-0 bg-white items-center justify-between'>
          <div className='flex p-5 px-7'>
            <h1 className='text-5xl font-medium uppercase'>
              {type === "text" ? "Text" : "File"}
            </h1>
          </div>
          <div className='flex'>
            <div
              className={type === "text" ? "switcher active" : "switcher"}
              onClick={() => setType("text")}
            >
              {type === "file" ? (
                <LuText size={40} />
              ) : (
                <LuLetterText size={40} className="tab-Icons" />
              )}
            </div>
            <div
              className={type === "file" ? "switcher active" : "switcher"}
              onClick={() => setType("file")}
            >
              {type === "text" ? (
                <LuFile size={40} />
              ) : (
                <LuFiles size={40} className="tab-Icons" />
              )}
            </div>
          </div>
        </div>
        {type === "text" ? (
          <div className='right-section px-9 rounded-b-2xl bg-white'>
            <TextArea
              ref={textAreaRef}
              value={value}
              onChangeText={(value) => {
                setValue(value);
                setBtnText("Save");
              }}
            />

            <div className='w-full flex justify-end gap-15'>
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
              <div className='urls-container flex flex-col gap-1'>
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
          <div className='right-section px-9'>
            {file.length ? (
              <div className='withFiles flex flex-wrap min-h-70'>
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
                className='dropzone min-h-74'
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
      <div>
        {docIdRef.current ? (
          <SharedUrl
            copyUrl={copyUrl}
            popoverContent={popoverContent}
            shareableUrl={shareableUrl}
          />
        ) : (
          ""
        )}
      </div>
    </div>
  );
};

export default Home;
