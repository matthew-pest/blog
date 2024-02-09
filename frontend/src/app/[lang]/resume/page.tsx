// import React from 'react';

// const Page = () => {
//   const pdfUrl = 'https://elasticbeanstalk-us-east-2-641171614455.s3.us-east-2.amazonaws.com/matthew-pest-resume.pdf'; // Replace with the actual URL to your PDF

//   return (
//     <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
//       <h1 className="text-2xl font-bold text-gray-800 mb-4">Last Updated Jan 9 2024</h1>
//       <iframe
//         className="w-full h-screen" // Adjust width and height as needed
//         src={pdfUrl + "#toolbar=0&navpanes=0&scrollbar=0"} // URL modifications
//         title="PDF Viewer"
//         style={{
//             width: "100%", 
//             height: "116vh", // Adjust to the viewport height
//             overflow: "hidden"
//         }}
//       />
//       <a
//         href={pdfUrl}
//         download
//         className="mt-4 px-6 py-2 bg-blue-500 text-white font-semibold rounded hover:bg-blue-700 transition-colors"
//       >
//         Download PDF
//       </a>
//     </div>
//   );
// }

// export default Page;

import React from 'react';

const Page = () => {
  const pdfUrl = 'https://elasticbeanstalk-us-east-2-641171614455.s3.us-east-2.amazonaws.com/matthew-pest-resume.pdf'; // Replace with the actual URL to your PDF
  const htmlContent = {
    __html: `
      <div style="position: relative; width: 100%; height: 0; padding-top: 129.4118%;
      padding-bottom: 0; box-shadow: 0 2px 8px 0 rgba(63,69,81,0.16); margin-top: 1.6em; margin-bottom: 0.9em; overflow: hidden;
      border-radius: 8px; will-change: transform;">
      <iframe loading="lazy" style="position: absolute; width: 100%; height: 100%; top: 0; left: 0; border: none; padding: 0;margin: 0;"
        src="https:&#x2F;&#x2F;www.canva.com&#x2F;design&#x2F;DAF8S9IEhdk&#x2F;-fSPn5bFjI7hHn88eTnw4w&#x2F;view?embed" allowfullscreen="allowfullscreen" allow="fullscreen">
      </iframe>
      </div>
    `,
  };

  return (
    <div className="flex flex-col items-center justify-center px-4 lg:px-8">
      {/* Adjusting the width to use the middle third of the screen */}
      <div className="w-full md:w-2/3 lg:w-1/3" dangerouslySetInnerHTML={htmlContent} />
      <a
        href={pdfUrl}
        download
        className="mt-4 px-6 py-2 bg-blue-500 text-white font-semibold rounded hover:bg-blue-700 transition-colors"
      >
        Download PDF
      </a>
    </div>
  );
};

export default Page;
