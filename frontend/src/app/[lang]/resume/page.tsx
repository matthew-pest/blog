import React from 'react';

const Page = () => {
  const pdfUrl = 'https://elasticbeanstalk-us-east-2-641171614455.s3.us-east-2.amazonaws.com/matthew-pest-resume.pdf'; // Replace with the actual URL to your PDF

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Last Updated Jan 9 2024</h1>
      <iframe
        className="w-full h-screen" // Adjust width and height as needed
        src={pdfUrl + "#toolbar=0&navpanes=0&scrollbar=0"} // URL modifications
        title="PDF Viewer"
        style={{
            width: "100%", 
            height: "116vh", // Adjust to the viewport height
            overflow: "hidden"
        }}
      />
      <a
        href={pdfUrl}
        download
        className="mt-4 px-6 py-2 bg-blue-500 text-white font-semibold rounded hover:bg-blue-700 transition-colors"
      >
        Download PDF
      </a>
    </div>
  );
}

export default Page;