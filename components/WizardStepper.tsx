const STEPS = [
  {
    title: "Медиа",
    subtitle:
      "Зураг, хөгжим — өөрчлөлт бүр урилгын урьдчилсан харагдацад шууд харагдана",
  },
  {
    title: "Үндсэн мэдээлэл",
    subtitle:
      "Гарчиг, огноо, байршил, урилгын үг — зочдод харагдах мэдээлэл",
  },
  {
    title: "Харагдац",
    subtitle:
      "Өнгө, хээ, анимэйшн — урилгын төрх",
  },
  {
    title: "Баталгаажуулах",
    subtitle:
      "Урилгаа шалгаад нийтлэхэд бэлэн болгоно",
  },
];

type Props = {
  step: 1 | 2 | 3 | 4;
  onStepClick?: (step: 1 | 2 | 3 | 4) => void;
  showHeading?: boolean;
};

export default function WizardStepper({
  step,
  onStepClick,
  showHeading = true,
}: Props) {
  const current = STEPS[step - 1];

  return (
    <div>
      {showHeading && (
        <div className="mb-5">
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-[#A48663]">
            Урилга · Алхам {step}/4
          </div>

          <h1 className="mt-3 text-4xl font-medium tracking-tight sm:text-5xl">
            {current.title}
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-black/45">
            {current.subtitle}
          </p>
        </div>
      )}

      <ol
        aria-label="Алхмууд"
        className="flex items-center gap-2"
      >
        {STEPS.map((item, index) => {
          const number = (index + 1) as 1 | 2 | 3 | 4;
          const active = number === step;
          const done = number < step;
          const clickable =
            done && Boolean(onStepClick);

          return (
            <li
              key={item.title}
              className="flex items-center gap-2"
            >
              <button
                type="button"
                disabled={!clickable}
                onClick={() =>
                  onStepClick?.(number)
                }
                aria-current={
                  active ? "step" : undefined
                }
                title={`${number}. ${item.title}`}
                className={`flex h-9 items-center gap-2 rounded-full px-3 text-xs font-semibold transition ${
                  active
                    ? "bg-black text-white"
                    : done
                    ? "bg-black/10 text-black hover:bg-black/15"
                    : "bg-black/5 text-black/35"
                } ${
                  clickable
                    ? "cursor-pointer"
                    : "cursor-default"
                }`}
              >
                <span>{done ? "✓" : number}</span>

                {active && (
                  <span>{item.title}</span>
                )}
              </button>

              {index < STEPS.length - 1 && (
                <span className="h-px w-4 bg-black/15" />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}