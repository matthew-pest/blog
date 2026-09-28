import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface RichTextProps {
  data: {
    content: string;
  };
}

export default function RichText({ data }: RichTextProps) {
  return (
    <section className="mx-auto max-w-3xl px-5 py-10">
      <div className="prose-site">
        <Markdown remarkPlugins={[remarkGfm]}>{data.content}</Markdown>
      </div>
    </section>
  );
}
