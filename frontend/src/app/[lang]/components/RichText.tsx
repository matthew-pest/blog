import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface RichTextProps {
  data: {
    body: string;
  };
}

export default function RichText({ data }: RichTextProps) {
  return (
    <section className="prose-site">
      <Markdown remarkPlugins={[remarkGfm]}>{data.body}</Markdown>
    </section>
  );
}
