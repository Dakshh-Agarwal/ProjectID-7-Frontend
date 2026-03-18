export default function MessageBubble({ role, content, type }) {
  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div className="bg-indigo-600 text-white rounded-2xl rounded-br-sm px-4 py-3 max-w-md slide-right text-sm">
          {content}
        </div>
      </div>
    );
  }

  let bubbleClasses = "flex justify-start items-start gap-2";
  let contentClasses = "white bg-white shadow-sm rounded-2xl rounded-bl-sm px-4 py-3 max-w-xl slide-left text-sm text-gray-800 whitespace-pre-wrap";
  let tagContent = null;
  let tagColor = null;

  if (type === "check_question") {
    contentClasses += " bg-yellow-50 border-l-4 border-yellow-400";
    tagContent = "Quick Check 🎯";
    tagColor = "text-yellow-600";
  } else if (type === "evaluation_correct") {
    contentClasses += " bg-green-50 border-l-4 border-green-400";
    tagContent = "Got it! ✅";
    tagColor = "text-green-600";
  } else if (type === "evaluation_wrong") {
    contentClasses += " bg-red-50 border-l-4 border-red-400";
    tagContent = "Let us revisit 🔄";
    tagColor = "text-red-600";
  }

  return (
    <div className={bubbleClasses}>
      <span className="text-2xl">🧠</span>
      <div className="flex flex-col gap-1">
        {tagContent && (
          <span className={`text-xs ${tagColor} font-medium`}>
            {tagContent}
          </span>
        )}
        <div className={contentClasses}>
          {content}
        </div>
      </div>
    </div>
  );
}
