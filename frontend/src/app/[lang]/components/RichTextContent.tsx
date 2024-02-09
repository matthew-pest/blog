import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useEffect } from "react";

interface RichTextProps {
  data: {
    content: string;
  };
}

export default function RichText({ data }: RichTextProps) {
  return (
    <section className="flex justify-center items-center py-6 dark:bg-black dark:text-gray-50">
      <div className="w-2/3">
        <Markdown children={data.content} remarkPlugins={[remarkGfm]} />
      </div>
    </section>
  );
}
