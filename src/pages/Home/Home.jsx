import React, { useState, useRef, useEffect } from "react";
import { TextArea, Button, Dropzone, FileList } from "../../components";
import {
  db,
  doc,
  onSnapshot,
  collection,
  setDoc,
  updateDoc,
  getDocs,
  arrayUnion,
} from "../../config/firebaseConfig.js";
import Text_Grey from "../../assets/text-grey.svg";
import Text_Color from "../../assets/text-color.svg";
import File_Grey from "../../assets/files-grey.svg";
import File_Color from "../../assets/files-color.svg";
import { FaPlus } from "react-icons/fa6";

import "./style.scss";

const Home = () => {
  const [type, setType] = useState("text");
  const [value, setValue] = useState("");
  const [file, setfile] = useState([]);
  const [urls, setUrls] = useState([]);
  const [btnText, setBtnText] = useState('Save');
  const textAreaRef = useRef(null)


  async function checkIfCollectionExists(collectionName) {
    const querySnapshot = await getDocs(collection(db, collectionName));
    return !querySnapshot.empty;
  }

  const saveTextBtn = async (event) => {
    if (btnText === 'Save') {
      setBtnText('Saving...')
      const urls = extractUrls(value);
    setUrls([...new Set(urls)]);
    let isDocExist = await checkIfCollectionExists("text");

    if (isDocExist) {
      await updateDoc(doc(db, "text", "shared"), {
        text: value,
      });
    } else {
      await setDoc(doc(db, "text", "shared"), {
        text: value,
      });
    }
    setBtnText('Copy')
    } else {
      textAreaRef.current.select()
      window.navigator.clipboard.writeText(textAreaRef.current.value)
    }
  };

  useEffect(() => {
    const docRef = doc(db, "text", "shared");

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        let text = docSnap.data().text;
        setValue(text);
        let urls = extractUrls(text);
        setUrls([...new Set(urls)]);
        setBtnText('Copy')
      }
    });
    return () => unsubscribe();
  }, []);

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
          base64: base64, // make sure this is a string only
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
    setBtnText('Saving...')
    setValue('')
    let isDocExist = await checkIfCollectionExists("text");

    if (isDocExist) {
      await updateDoc(doc(db, "text", "shared"), {
        text: "",
      });

      setBtnText('Save')
      setUrls([])
    }
  };

  const extractUrls = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.match(urlRegex) || [];
  };

  return (
    <div className='main-container min-h-120 bg-white shadow-2xl flex mb-10'>
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
          <h1>Text</h1>
          <TextArea ref={textAreaRef} value={value} onChangeText={(value) => {setValue(value); setBtnText('Save')}} />
          <div className='w-full flex justify-end py-4 gap-15'>
            {value === "" ? (
              ""
            ) : (
              <button className='px-5 cursor-pointer' onClick={clearText}>
                clear
              </button>
            )}
            <Button
              onClick={saveTextBtn}
              disable={value === "" ? true : false}
              children={btnText}
            />
          </div>
          {urls.length > 0 ? <div className='urls-container p-4 flex flex-col gap-1'>
            {urls.length ? (urls.map((url, i)=> <a key={i} href={url} target="_blank">{url}</a>)): ''}
          </div> : ''}
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
