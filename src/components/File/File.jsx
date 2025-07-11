import React, { useEffect, useState } from "react";
import { FaFileAlt, FaJs, FaHtml5, FaCss3Alt, FaFilePdf } from "react-icons/fa";
import "./style.scss";

const File = ({ file }) => {
  
  const [isImage, setIsImage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const imageTypes = ["jpeg", "png", "gif", "bmp", "webp", "svg+xml"];
    const type = file.type.split("/")[1];
    setIsImage(imageTypes.includes(type));
    const timeout = setTimeout(() => setIsLoading(false), 300);

    return () => clearTimeout(timeout);
  }, [file]);

  const getFileIcon = (extension) => {
    switch (extension) {
      case "html":
        return <FaHtml5 className='text-orange-500 text-xl' />;
      case "css":
        return <FaCss3Alt className='text-blue-500 text-xl' />;
      case "js":
        return <FaJs className='text-yellow-400 text-xl' />;
      case "pdf":
        return <FaFilePdf className='text-red-600 text-xl' />;
      default:
        return <FaFileAlt className='text-gray-400 text-xl' />;
    }
  };

  const extension = file.name.split(".").pop().toLowerCase();

  return (
    <div className='files'>
      {isLoading ? (
        <div className='flex justify-center items-center h-24 w-full'>
          <div className='w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin'></div>
        </div>
      ) : isImage ? (
        <div className='img-file'>
          <img src={file.file} alt={file.name} />
        </div>
      ) : (
        <div className='files'>
          {getFileIcon(extension)}
          <p className='file-name text-gray-600'>
            {file.name.slice(0, file.name.lastIndexOf(".")).length > 7
              ? file.name.slice(0, 5) + "..."
              : file.name.slice(0, file.name.lastIndexOf("."))}
            <strong className='text-gray-800'>
              {file.name.slice(file.name.lastIndexOf("."))}
            </strong>
          </p>
        </div>
      )}
    </div>
  );
};

export default File;
