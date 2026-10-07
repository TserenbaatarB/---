"use client";

import { Suspense } from "react";

import {
  ChangeEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BrandLogo from "@/components/BrandLogo";
import WizardStepper from "@/components/WizardStepper";
import VideoAndMusic from "@/components/VideoAndMusic";
import ExtrasEditor from "@/components/ExtrasEditor";
import {
  InvitationExtras,
  defaultExtras,
  readExtras,
  writeExtras,
} from "@/lib/invitationExtras";

type GalleryPhoto = {
  id: number;
  url: string;
  file: File;
  caption: string;
};

type StoredInvitationImages = {
  backgroundId: string | null;
  galleryIds: string[];
  galleryCaptions?: string[];
};

type StoredInvitationMusic = {
  musicId: string | null;
  musicName: string | null;
  musicType: "none" | "custom";
};

type ExampleData = {
  title: string;
  names: string;
  venue: string;
  address: string;
  message: string;
};

const DB_NAME = "urilga-invitation-db";
const DB_VERSION = 1;
const STORE_NAME = "images";

/* =========================================================
   EXAMPLE DATA
========================================================= */

const exampleDataByEvent: Record<
  string,
  Record<string, ExampleData>
> = {
  wedding: {
    classic: {
      title: "Бидний хурим",
      names: "Бат & Номин",
      venue: "Shangri-La Hotel",
      address: "Улаанбаатар хот",
      message:
        "Бидний амьдралын хамгийн сайхан мөчийг хамтдаа хуваалцахыг урьж байна.",
    },
    "classic-gold": {
      title: "Бидний хурим",
      names: "Бат & Номин",
      venue: "Shangri-La Hotel",
      address: "Улаанбаатар хот",
      message:
        "Хайр, аз жаргалынхаа хамгийн нандин мөчийг эрхэм та бүхэнтэйгээ хамт тэмдэглэхийг урьж байна.",
    },
    luxury: {
      title: "Our Wedding Day",
      names: "Бат & Номин",
      venue: "Corporate Convention Centre",
      address: "Улаанбаатар хот",
      message:
        "Бидний амьдралын шинэ эхлэлийг хамтдаа тэмдэглэн, дурсамж бүтээхийг урьж байна.",
    },
    minimal: {
      title: "Бидний онцгой өдөр",
      names: "Бат & Номин",
      venue: "Blue Sky Hotel",
      address: "Улаанбаатар",
      message:
        "Энэ онцгой өдрийг бидэнтэй хамт өнгөрүүлээрэй.",
    },
    garden: {
      title: "Хайрын баяр",
      names: "Бат & Номин",
      venue: "Garden Hall",
      address: "Улаанбаатар хот",
      message:
        "Хайрынхаа хамгийн сайхан өдрийг дотнын хүмүүстэйгээ хамт тэмдэглэхийг урьж байна.",
    },
  },

  birthday: {
    classic: {
      title: "Төрсөн өдрийн баяр",
      names: "Номин",
      venue: "Modern Nomads",
      address: "Улаанбаатар хот",
      message:
        "Миний төрсөн өдрийн баярыг хамтдаа тэмдэглэж, сайхан дурсамж бүтээхийг урьж байна.",
    },
    "classic-gold": {
      title: "Төрсөн өдрийн баяр",
      names: "Номин",
      venue: "The Bull Hotpot",
      address: "Улаанбаатар хот",
      message:
        "Амьдралын минь нэгэн сайхан жилийг хамтдаа угтаж, баяр хөөрөө хуваалцаарай.",
    },
    luxury: {
      title: "Birthday Celebration",
      names: "Номин",
      venue: "Premium Lounge",
      address: "Улаанбаатар",
      message:
        "Онцгой нэгэн өдрийг хайртай дотнын хүмүүстэйгээ хамт тэмдэглэхийг урьж байна.",
    },
    minimal: {
      title: "Төрсөн өдөр",
      names: "Номин",
      venue: "Coffee & Wine",
      address: "Улаанбаатар",
      message:
        "Энгийн хэрнээ дурсамжтай нэгэн үдшийг хамт өнгөрүүлээрэй.",
    },
    garden: {
      title: "Birthday Garden Party",
      names: "Номин",
      venue: "Garden House",
      address: "Улаанбаатар",
      message:
        "Инээд хөөр, цэцэгс, дурсамжаар дүүрэн төрсөн өдрийн баярт хүрэлцэн ирээрэй.",
    },
  },

  baby: {
    classic: {
      title: "Сэвлэг үргээх ёслол",
      names: "Бяцхан Тэмүүлэн",
      venue: "Монгол зоогийн газар",
      address: "Улаанбаатар хот",
      message:
        "Бяцхан үрийнхээ сэвлэг үргээх ёслолд хүрэлцэн ирж, ерөөлөө хайрлаарай.",
    },
    "classic-gold": {
      title: "Бяцхан үрийн баяр",
      names: "Тэмүүлэн",
      venue: "Royal Palace",
      address: "Улаанбаатар хот",
      message:
        "Бяцхан үрийнхээ анхны сайхан дурсамжийн нэгэн өдөрт хамтдаа баярлахыг урьж байна.",
    },
    luxury: {
      title: "Baby Celebration",
      names: "Тэмүүлэн",
      venue: "Grand Ballroom",
      address: "Улаанбаатар",
      message:
        "Бяцхан үрийнхээ сэвлэг үргээх ёслолд хүрэлцэн ирж, ерөөл буянаа хайрлана уу.",
    },
    minimal: {
      title: "Сэвлэг үргээх ёслол",
      names: "Тэмүүлэн",
      venue: "Family Hall",
      address: "Улаанбаатар",
      message:
        "Бяцхан үрийнхээ онцгой өдрийг хамтдаа тэмдэглэцгээе.",
    },
    garden: {
      title: "Бяцхан үрийн баяр",
      names: "Тэмүүлэн",
      venue: "Garden Hall",
      address: "Улаанбаатар",
      message:
        "Цэцэгсийн дунд бяцхан үрийнхээ баярыг хамтдаа тэмдэглэхийг урьж байна.",
    },
  },

  anniversary: {
    classic: {
      title: "Бидний ойн баяр",
      names: "Бат & Номин",
      venue: "Blue Sky Hotel",
      address: "Улаанбаатар хот",
      message:
        "Хамтдаа бүтээсэн сайхан дурсамжуудаа эргэн санаж, ойн баяраа хамтдаа тэмдэглэцгээе.",
    },
    "classic-gold": {
      title: "Хамтын амьдралын ой",
      names: "Бат & Номин",
      venue: "Shangri-La Hotel",
      address: "Улаанбаатар хот",
      message:
        "Хайр, аз жаргалаар дүүрэн хамтын амьдралынхаа ойн баярыг хамтдаа тэмдэглэхийг урьж байна.",
    },
    luxury: {
      title: "Anniversary Celebration",
      names: "Бат & Номин",
      venue: "Premium Ballroom",
      address: "Улаанбаатар",
      message:
        "Хамтдаа туулсан он жилүүдээ тэмдэглэн, дурсамжаа хуваалцахыг урьж байна.",
    },
    minimal: {
      title: "Бидний ой",
      names: "Бат & Номин",
      venue: "The Terrace",
      address: "Улаанбаатар",
      message:
        "Бидний хамтын аяллын нэгэн сайхан өдрийг хамт тэмдэглээрэй.",
    },
    garden: {
      title: "Хайрын ойн баяр",
      names: "Бат & Номин",
      venue: "Garden Restaurant",
      address: "Улаанбаатар",
      message:
        "Хайрынхаа түүхийг хамтдаа тэмдэглэн, сайхан үдшийг өнгөрүүлэхийг урьж байна.",
    },
  },

  graduation: {
    classic: {
      title: "Төгсөлтийн баяр",
      names: "2027 оны төгсөгчид",
      venue: "Corporate Hotel",
      address: "Улаанбаатар хот",
      message:
        "Олон жилийн хөдөлмөрийнхөө үр шимийг тэмдэглэх төгсөлтийн баярт хамтдаа оролцоорой.",
    },
    "classic-gold": {
      title: "Төгсөлтийн баярын үдэш",
      names: "2027 оны төгсөгчид",
      venue: "Shangri-La Hotel",
      address: "Улаанбаатар хот",
      message:
        "Бидний амжилтын нэгэн чухал өдрийг хамтдаа тэмдэглэн, сайхан дурсамж бүтээхийг урьж байна.",
    },
    luxury: {
      title: "Graduation Celebration",
      names: "Class of 2027",
      venue: "Grand Ballroom",
      address: "Улаанбаатар",
      message:
        "Шинэ эхлэл рүү алхах энэ онцгой мөчөө хамтдаа тэмдэглэцгээе.",
    },
    minimal: {
      title: "Төгсөлт 2027",
      names: "2027 оны төгсөгчид",
      venue: "Event Hall",
      address: "Улаанбаатар",
      message:
        "Нэгэн аяллын төгсгөл, шинэ аяллын эхлэлийг хамт тэмдэглээрэй.",
    },
    garden: {
      title: "Төгсөлтийн баяр",
      names: "2027 оны төгсөгчид",
      venue: "Garden Event Space",
      address: "Улаанбаатар",
      message:
        "Инээд хөөр, баяр баяслаар дүүрэн төгсөлтийн үдэшлэгт хүрэлцэн ирээрэй.",
    },
  },

  engagement: {
    classic: {
      title: "Сүй тавих ёслол",
      names: "Бат & Номин",
      venue: "Modern Palace",
      address: "Улаанбаатар хот",
      message:
        "Хоёр гэр бүлийн шинэ холбооны эхлэлийг хамтдаа тэмдэглэхийг урьж байна.",
    },
    "classic-gold": {
      title: "Бидний шинэ эхлэл",
      names: "Бат & Номин",
      venue: "Royal Palace",
      address: "Улаанбаатар хот",
      message:
        "Хайрынхаа дараагийн алхмыг хийж буй энэ онцгой мөчөө эрхэм та бүхэнтэйгээ хуваалцахыг хүсэж байна.",
    },
    luxury: {
      title: "Engagement Celebration",
      names: "Бат & Номин",
      venue: "Grand Ballroom",
      address: "Улаанбаатар",
      message:
        "Бидний амьдралын шинэ бүлгийн эхлэлийг хамтдаа тэмдэглэн өнгөрүүлээрэй.",
    },
    minimal: {
      title: "Сүй тавих ёслол",
      names: "Бат & Номин",
      venue: "The Terrace",
      address: "Улаанбаатар",
      message:
        "Бидний шинэ эхлэлийг хамтдаа тэмдэглээрэй.",
    },
    garden: {
      title: "Хайрын шинэ эхлэл",
      names: "Бат & Номин",
      venue: "Garden Hall",
      address: "Улаанбаатар",
      message:
        "Цэцэгсийн дунд хайрынхаа шинэ эхлэлийг хамтдаа тэмдэглэхийг урьж байна.",
    },
  },

  housewarming: {
    classic: {
      title: "Шинэ гэрийн найр",
      names: "Бат & Номин",
      venue: "Манай шинэ гэр",
      address: "Хан-Уул дүүрэг",
      message:
        "Шинэ гэрийнхээ босгыг алхаж, баяр хөөрөө хуваалцах найранд хүрэлцэн ирээрэй.",
    },
    "classic-gold": {
      title: "Шинэ гэрийн баяр",
      names: "Бат & Номин",
      venue: "Манай шинэ гэр",
      address: "Улаанбаатар хот",
      message:
        "Шинэ гэрийнхээ анхны баярыг дотнын хүмүүстэйгээ хамт тэмдэглэхийг урьж байна.",
    },
    luxury: {
      title: "Housewarming Celebration",
      names: "Бат & Номин",
      venue: "Our New Home",
      address: "Улаанбаатар",
      message:
        "Шинэ гэрийнхээ баярт хүрэлцэн ирж, ерөөл дурсамжаа хуваалцаарай.",
    },
    minimal: {
      title: "Шинэ гэрийн найр",
      names: "Бат & Номин",
      venue: "Манай шинэ гэр",
      address: "Улаанбаатар",
      message:
        "Шинэ гэрийнхээ баярыг хамтдаа тэмдэглэцгээе.",
    },
    garden: {
      title: "Шинэ гэрийн баяр",
      names: "Бат & Номин",
      venue: "Garden Home",
      address: "Улаанбаатар",
      message:
        "Шинэ гэрийнхээ дулаан уур амьсгалыг дотнын хүмүүстэйгээ хуваалцахыг урьж байна.",
    },
  },

  other: {
    classic: {
      title: "Онцгой арга хэмжээ",
      names: "Бат & Номин",
      venue: "Event Hall",
      address: "Улаанбаатар хот",
      message:
        "Бидний онцгой өдрийг хамтдаа тэмдэглэн, сайхан дурсамж бүтээхийг урьж байна.",
    },
    "classic-gold": {
      title: "Онцгой өдөр",
      names: "Бат & Номин",
      venue: "Grand Event Hall",
      address: "Улаанбаатар хот",
      message:
        "Энэ онцгой өдрийг эрхэм та бүхэнтэйгээ хамт тэмдэглэхийг урьж байна.",
    },
    luxury: {
      title: "Special Celebration",
      names: "Бат & Номин",
      venue: "Premium Event Hall",
      address: "Улаанбаатар",
      message:
        "Мартагдашгүй нэгэн өдрийг хамтдаа тэмдэглэн өнгөрүүлэхийг урьж байна.",
    },
    minimal: {
      title: "Онцгой арга хэмжээ",
      names: "Бат & Номин",
      venue: "Event Space",
      address: "Улаанбаатар",
      message:
        "Энэ өдрийг хамтдаа өнгөрүүлээрэй.",
    },
    garden: {
      title: "Онцгой баяр",
      names: "Бат & Номин",
      venue: "Garden Event Space",
      address: "Улаанбаатар",
      message:
        "Дурсамж дүүрэн нэгэн сайхан өдрийг хамтдаа тэмдэглэхийг урьж байна.",
    },
  },
};

/* =========================================================
   DEFAULT EVENT ICON
========================================================= */

function getEventIcon(eventType: string): string {
  switch (eventType) {
    case "wedding":
      return "💍";

    case "birthday":
      return "🎂";

    case "baby":
      return "👶";

    case "anniversary":
      return "🥂";

    case "graduation":
      return "🎓";

    case "engagement":
      return "💐";

    case "housewarming":
      return "🏡";

    default:
      return "🎉";
  }
}

/* =========================================================
   INDEXED DB
========================================================= */

function openImageDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(
      DB_NAME,
      DB_VERSION
    );

    request.onerror = () => {
      reject(
        request.error ??
          new Error("IndexedDB нээхэд алдаа гарлаа.")
      );
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

/* =========================================================
   SAVE FILE / BLOB
========================================================= */

async function saveImage(
  id: string,
  file: File
): Promise<void> {
  const db = await openImageDatabase();

  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction(
        STORE_NAME,
        "readwrite"
      );

      const store =
        transaction.objectStore(STORE_NAME);

      const blob = new Blob(
        [file],
        {
          type:
            file.type ||
            "application/octet-stream",
        }
      );

      store.put(blob, id);

      transaction.oncomplete = () => {
        db.close();
        resolve();
      };

      transaction.onerror = () => {
        db.close();

        reject(
          transaction.error ??
            new Error(
              "Файл IndexedDB-д хадгалахад алдаа гарлаа."
            )
        );
      };

      transaction.onabort = () => {
        db.close();

        reject(
          transaction.error ??
            new Error(
              "Файл хадгалах transaction зогслоо."
            )
        );
      };
    } catch (error) {
      db.close();
      reject(error);
    }
  });
}

/* =========================================================
   READ FILE / BLOB
========================================================= */

async function getStoredBlob(
  id: string
): Promise<Blob | null> {
  const db = await openImageDatabase();

  return new Promise((resolve, reject) => {
    const request = db
      .transaction(STORE_NAME, "readonly")
      .objectStore(STORE_NAME)
      .get(id);

    request.onsuccess = () => {
      db.close();

      resolve(
        request.result instanceof Blob
          ? request.result
          : null
      );
    };

    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

function blobToFile(
  blob: Blob,
  name: string
): File {
  return new File([blob], name, {
    type: blob.type,
  });
}

/* =========================================================
   CLEAR OLD IMAGES + MUSIC
========================================================= */

async function clearStoredInvitationImages(): Promise<void> {
  const db = await openImageDatabase();

  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction(
        STORE_NAME,
        "readwrite"
      );

      const store =
        transaction.objectStore(STORE_NAME);

      store.clear();

      transaction.oncomplete = () => {
        db.close();
        resolve();
      };

      transaction.onerror = () => {
        db.close();

        reject(
          transaction.error ??
            new Error(
              "Хуучин зураг болон дуу цэвэрлэхэд алдаа гарлаа."
            )
        );
      };

      transaction.onabort = () => {
        db.close();

        reject(
          transaction.error ??
            new Error(
              "Зураг болон дуу хадгалах transaction зогслоо."
            )
        );
      };
    } catch (error) {
      db.close();
      reject(error);
    }
  });
}

/* =========================================================
   COMPONENT
========================================================= */

function InvitationDetailsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const eventType =
    searchParams.get("event") ?? "wedding";

  const template =
    searchParams.get("template") ??
    "classic-gold";

  const returnStep = searchParams.get("step");

  /* =======================================================
     EXAMPLE DATA
  ======================================================= */

  const exampleData = useMemo<ExampleData>(() => {
    const eventData =
      exampleDataByEvent[eventType] ??
      exampleDataByEvent.other;

    return (
      eventData[template] ??
      eventData["classic-gold"] ??
      eventData.classic ??
      exampleDataByEvent.other.classic
    );
  }, [eventType, template]);

  const [step, setStep] = useState<1 | 2>(
    returnStep === "2" ? 2 : 1
  );

  /* =======================================================
     TEXT DATA
  ======================================================= */

  const [title, setTitle] = useState("");
  const [names, setNames] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [venue, setVenue] = useState("");
  const [address, setAddress] = useState("");
  const [message, setMessage] = useState("");
  const [phone, setPhone] = useState("");

  /* =======================================================
     BACKGROUND
  ======================================================= */

  const [
    backgroundImage,
    setBackgroundImage,
  ] = useState("");

  const [
    backgroundFile,
    setBackgroundFile,
  ] = useState<File | null>(null);

  /* =======================================================
     GALLERY
  ======================================================= */

  const [gallery, setGallery] = useState<
    GalleryPhoto[]
  >([]);

  /* =======================================================
     MUSIC
  ======================================================= */

  const [
    musicFile,
    setMusicFile,
  ] = useState<File | null>(null);

  const [
    musicUrl,
    setMusicUrl,
  ] = useState("");

  const [dragIndex, setDragIndex] = useState<
    number | null
  >(null);

  function moveGalleryPhoto(
    from: number,
    to: number
  ) {
    setGallery((current) => {
      if (
        from === to ||
        from < 0 ||
        to < 0 ||
        from >= current.length ||
        to >= current.length
      ) {
        return current;
      }

      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);

      return next;
    });
  }

  /* =======================================================
     EXTRAS + COVER VIDEO
  ======================================================= */

  const [extras, setExtras] =
    useState<InvitationExtras>(
      defaultExtras
    );

  const [coverVideo, setCoverVideo] =
    useState<File | null>(null);

  function patchExtras(
    patch: Partial<InvitationExtras>
  ) {
    setExtras((current) => ({
      ...current,
      ...patch,
    }));
  }

  /* =======================================================
     SAVING
  ======================================================= */

  const [
    savingImages,
    setSavingImages,
  ] = useState(false);

  /* =======================================================
     CLEANUP OBJECT URLS
  ======================================================= */

  useEffect(() => {
    return () => {
      if (backgroundImage) {
        URL.revokeObjectURL(
          backgroundImage
        );
      }

      if (musicUrl) {
        URL.revokeObjectURL(
          musicUrl
        );
      }

      gallery.forEach((photo) => {
        URL.revokeObjectURL(photo.url);
      });
    };
  }, []);

  /* =======================================================
     RESTORE WHEN COMING BACK FROM A LATER STEP
  ======================================================= */

  useEffect(() => {
    if (!returnStep) return;

    let cancelled = false;

    async function restore() {
      try {
        const rawDetails =
          sessionStorage.getItem("invitation-details");

        if (rawDetails) {
          const saved = JSON.parse(rawDetails);

          setTitle(saved.title ?? "");
          setNames(saved.names ?? "");
          setDate(saved.date ?? "");
          setTime(saved.time ?? "");
          setVenue(saved.venue ?? "");
          setAddress(saved.address ?? "");
          setMessage(saved.message ?? "");
          setPhone(saved.phone ?? "");
        }

        const savedExtras = readExtras();

        setExtras(savedExtras);

        const rawImages =
          sessionStorage.getItem("invitation-images");

        if (rawImages) {
          const images: StoredInvitationImages =
            JSON.parse(rawImages);

          if (images.backgroundId) {
            const blob = await getStoredBlob(
              images.backgroundId
            );

            if (blob && !cancelled) {
              setBackgroundFile(
                blobToFile(blob, "background")
              );
              setBackgroundImage(
                URL.createObjectURL(blob)
              );
            }
          }

          const photos: GalleryPhoto[] = [];

          for (const [
            index,
            id,
          ] of (images.galleryIds ?? []).entries()) {
            const blob = await getStoredBlob(id);

            if (blob) {
              photos.push({
                id: Date.now() + index,
                url: URL.createObjectURL(blob),
                file: blobToFile(
                  blob,
                  `gallery-${index + 1}`
                ),
                caption:
                  images.galleryCaptions?.[index] ??
                  "",
              });
            }
          }

          if (!cancelled) {
            setGallery(photos);
          }
        }

        const rawMusic =
          sessionStorage.getItem("invitation-music");

        if (rawMusic) {
          const music: StoredInvitationMusic =
            JSON.parse(rawMusic);

          if (
            music.musicType === "custom" &&
            music.musicId
          ) {
            const blob = await getStoredBlob(
              music.musicId
            );

            if (blob && !cancelled) {
              setMusicFile(
                blobToFile(
                  blob,
                  music.musicName ?? "music.mp3"
                )
              );
              setMusicUrl(URL.createObjectURL(blob));
            }
          }
        }

        if (savedExtras.coverVideoId) {
          const blob = await getStoredBlob(
            savedExtras.coverVideoId
          );

          if (blob && !cancelled) {
            setCoverVideo(
              blobToFile(
                blob,
                savedExtras.coverVideoName ?? "cover-video"
              )
            );
          }
        }
      } catch (error) {
        console.error("Details restore error:", error);
      }
    }

    void restore();

    return () => {
      cancelled = true;
    };
  }, [returnStep]);

  /* =======================================================
     FORMATTED DATE
  ======================================================= */

  const formattedDate = useMemo(() => {
    if (!date) return "";

    const selectedDate = new Date(
      `${date}T00:00:00`
    );

    if (
      Number.isNaN(
        selectedDate.getTime()
      )
    ) {
      return date;
    }

    return selectedDate.toLocaleDateString(
      "mn-MN",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );
  }, [date]);

  /* =======================================================
     BACKGROUND UPLOAD
  ======================================================= */

  function handleBackgroundUpload(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) return;

    if (backgroundImage) {
      URL.revokeObjectURL(
        backgroundImage
      );
    }

    const url =
      URL.createObjectURL(file);

    setBackgroundFile(file);
    setBackgroundImage(url);

    event.target.value = "";
  }

  /* =======================================================
     GALLERY UPLOAD
  ======================================================= */

  function handleGalleryUpload(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const files = Array.from(
      event.target.files ?? []
    );

    if (!files.length) return;

    const newPhotos: GalleryPhoto[] =
      files.map(
        (file, index) => ({
          id:
            Date.now() +
            index +
            Math.floor(
              Math.random() * 100000
            ),
          file,
          url:
            URL.createObjectURL(
              file
            ),
          caption: "",
        })
      );

    setGallery((current) => [
      ...current,
      ...newPhotos,
    ]);

    event.target.value = "";
  }

  /* =======================================================
     MUSIC UPLOAD
  ======================================================= */

  function handleMusicUpload(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) return;

    const isAudio =
      file.type === "audio/mpeg" ||
      file.type === "audio/mp3" ||
      file.name
        .toLowerCase()
        .endsWith(".mp3");

    if (!isAudio) {
      alert(
        "Зөвхөн MP3 файл оруулна уу."
      );

      event.target.value = "";
      return;
    }

    const maxSize =
      20 * 1024 * 1024;

    if (file.size > maxSize) {
      alert(
        "Дууны хэмжээ 20MB-аас ихгүй байна уу."
      );

      event.target.value = "";
      return;
    }

    if (musicUrl) {
      URL.revokeObjectURL(
        musicUrl
      );
    }

    const url =
      URL.createObjectURL(file);

    setMusicFile(file);
    setMusicUrl(url);

    event.target.value = "";
  }

  /* =======================================================
     REMOVE MUSIC
  ======================================================= */

  function removeMusic() {
    if (musicUrl) {
      URL.revokeObjectURL(
        musicUrl
      );
    }

    setMusicUrl("");
    setMusicFile(null);
  }

  /* =======================================================
     REMOVE GALLERY PHOTO
  ======================================================= */

  function removeGalleryPhoto(
    id: number
  ) {
    setGallery((current) => {
      const photo =
        current.find(
          (item) =>
            item.id === id
        );

      if (photo) {
        URL.revokeObjectURL(
          photo.url
        );
      }

      return current.filter(
        (item) =>
          item.id !== id
      );
    });
  }

  /* =======================================================
     REMOVE BACKGROUND
  ======================================================= */

  function removeBackground() {
    if (backgroundImage) {
      URL.revokeObjectURL(
        backgroundImage
      );
    }

    setBackgroundImage("");
    setBackgroundFile(null);
  }

  /* =======================================================
     CONTINUE
  ======================================================= */

  async function handleContinue() {
    if (savingImages) return;

    setSavingImages(true);

    try {
      await clearStoredInvitationImages();

      /* BACKGROUND */

      let backgroundId:
        | string
        | null = null;

      if (backgroundFile) {
        backgroundId =
          `background-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 12)}`;

        await saveImage(
          backgroundId,
          backgroundFile
        );
      }

      /* GALLERY */

      const galleryIds: string[] =
        [];

      const galleryCaptions: string[] =
        [];

      for (
        let index = 0;
        index < gallery.length;
        index++
      ) {
        const photo =
          gallery[index];

        if (!photo.file) {
          continue;
        }

        const galleryId =
          `gallery-${Date.now()}-${index}-${Math.random()
            .toString(36)
            .slice(2, 12)}`;

        await saveImage(
          galleryId,
          photo.file
        );

        galleryIds.push(
          galleryId
        );

        galleryCaptions.push(
          photo.caption ?? ""
        );
      }

      /* MUSIC */

      let musicId:
        | string
        | null = null;

      let musicName:
        | string
        | null = null;

      let musicType:
        | "none"
        | "custom" = "none";

      if (musicFile) {
        musicId =
          `music-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 12)}`;

        musicName =
          musicFile.name;

        musicType = "custom";

        await saveImage(
          musicId,
          musicFile
        );
      }

      /* COVER VIDEO */

      let coverVideoId: string | null = null;

      if (coverVideo) {
        coverVideoId = `video-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 12)}`;

        await saveImage(
          coverVideoId,
          coverVideo
        );
      }

      writeExtras({
        ...extras,
        coverVideoId,
        coverVideoName: coverVideo?.name ?? null,
        coverVideoPath: null,
      });

      /* IMAGE REFERENCES */

      const imageData: StoredInvitationImages =
        {
          backgroundId,
          galleryIds,
          galleryCaptions,
        };

      sessionStorage.setItem(
        "invitation-images",
        JSON.stringify(
          imageData
        )
      );

      /* MUSIC REFERENCE */

      const musicData: StoredInvitationMusic =
        {
          musicId,
          musicName,
          musicType,
        };

      sessionStorage.setItem(
        "invitation-music",
        JSON.stringify(
          musicData
        )
      );

      /* TEXT DATA */

      sessionStorage.setItem(
        "invitation-details",
        JSON.stringify({
          title,
          names,
          date,
          time,
          venue,
          address,
          message,
          phone,
          musicId,
          musicName,
          musicType,
        })
      );

      /* BUILDER */

      router.push(
        `/dashboard/invitations/new/builder?event=${eventType}&template=${template}`
      );
    } catch (error) {
      console.error(
        "Invitation image/music save error:",
        error
      );

      alert(
        "Зураг эсвэл дуу хадгалахад алдаа гарлаа. Дахин оролдоно уу."
      );
    } finally {
      setSavingImages(false);
    }
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="min-h-screen bg-[#F8F5F0] text-[#171717]">
      {/* HEADER */}

      <header className="border-b border-black/10 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
          <BrandLogo />

          <div className="text-xs text-black/35">
            {eventType} · {template}
          </div>
        </div>
      </header>

      {/* MAIN */}

      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10 lg:py-10">
        <div className="mb-8">
          <WizardStepper
            step={step}
            onStepClick={(target) =>
              target === 1
                ? setStep(1)
                : undefined
            }
          />
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
          {/* LEFT — EDITOR */}

          <section className="space-y-6">
            {/* BASIC INFORMATION */}

            {step === 2 && (
              <div className="rounded-[28px] border border-black/10 bg-white p-6 shadow-sm sm:p-7">
                <div>
                  <h2 className="text-lg font-semibold">
                    Үндсэн мэдээлэл
                  </h2>

                  <p className="mt-1 text-sm text-black/40">
                    Урилгын үндсэн текст болон арга хэмжээний мэдээлэл.
                  </p>
                </div>

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  {/* TITLE */}

                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-sm font-medium">
                      Урилгын гарчиг
                    </label>

                    <input
                      value={title}
                      onChange={(e) =>
                        setTitle(
                          e.target.value
                        )
                      }
                      placeholder={`Жишээ: ${exampleData.title}`}
                      className="w-full rounded-2xl border border-black/10 bg-[#F8F5F0] px-4 py-3.5 text-sm text-black outline-none placeholder:text-black/35 transition focus:border-black/25 focus:bg-white"
                    />
                  </div>

                  {/* NAMES */}

                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-sm font-medium">
                      Нэр
                    </label>

                    <input
                      value={names}
                      onChange={(e) =>
                        setNames(
                          e.target.value
                        )
                      }
                      placeholder={`Жишээ: ${exampleData.names}`}
                      className="w-full rounded-2xl border border-black/10 bg-[#F8F5F0] px-4 py-3.5 text-sm text-black outline-none placeholder:text-black/35 transition focus:border-black/25 focus:bg-white"
                    />
                  </div>

                  {/* DATE */}

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Огноо
                    </label>

                    <input
                      type="date"
                      value={date}
                      onChange={(e) =>
                        setDate(
                          e.target.value
                        )
                      }
                      className="w-full rounded-2xl border border-black/10 bg-[#F8F5F0] px-4 py-3.5 text-sm text-black outline-none focus:border-black/25 focus:bg-white"
                    />
                  </div>

                  {/* TIME */}

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Цаг
                    </label>

                    <input
                      type="time"
                      value={time}
                      onChange={(e) =>
                        setTime(
                          e.target.value
                        )
                      }
                      className="w-full rounded-2xl border border-black/10 bg-[#F8F5F0] px-4 py-3.5 text-sm text-black outline-none focus:border-black/25 focus:bg-white"
                    />
                  </div>

                  {/* VENUE */}

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Байршил
                    </label>

                    <input
                      value={venue}
                      onChange={(e) =>
                        setVenue(
                          e.target.value
                        )
                      }
                      placeholder={`Жишээ: ${exampleData.venue}`}
                      className="w-full rounded-2xl border border-black/10 bg-[#F8F5F0] px-4 py-3.5 text-sm text-black outline-none placeholder:text-black/35 transition focus:border-black/25 focus:bg-white"
                    />
                  </div>

                  {/* ADDRESS */}

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Хаяг
                    </label>

                    <input
                      value={address}
                      onChange={(e) =>
                        setAddress(
                          e.target.value
                        )
                      }
                      placeholder={`Жишээ: ${exampleData.address}`}
                      className="w-full rounded-2xl border border-black/10 bg-[#F8F5F0] px-4 py-3.5 text-sm text-black outline-none placeholder:text-black/35 transition focus:border-black/25 focus:bg-white"
                    />
                  </div>

                  {/* MESSAGE */}

                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-sm font-medium">
                      Урилгын мэндчилгээ
                    </label>

                    <textarea
                      value={message}
                      onChange={(e) =>
                        setMessage(
                          e.target.value
                        )
                      }
                      rows={4}
                      placeholder={`Жишээ: ${exampleData.message}`}
                      className="w-full resize-none rounded-2xl border border-black/10 bg-[#F8F5F0] px-4 py-3.5 text-sm leading-6 text-black outline-none placeholder:text-black/35 focus:border-black/25 focus:bg-white"
                    />
                  </div>

                  {/* PHONE */}

                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-sm font-medium">
                      Холбоо барих утас
                    </label>

                    <input
                      value={phone}
                      onChange={(e) =>
                        setPhone(
                          e.target.value
                        )
                      }
                      placeholder="Жишээ: 99112233"
                      className="w-full rounded-2xl border border-black/10 bg-[#F8F5F0] px-4 py-3.5 text-sm text-black outline-none placeholder:text-black/35 transition focus:border-black/25 focus:bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <ExtrasEditor
                extras={extras}
                onChange={patchExtras}
              />
            )}

            {step === 1 && (
              <>
                {/* BACKGROUND IMAGE */}

                <div className="rounded-[28px] border border-black/10 bg-white p-6 shadow-sm sm:p-7">
                  <div>
                    <h2 className="text-lg font-semibold">
                      Background зураг
                    </h2>

                    <p className="mt-1 text-sm text-black/40">
                      Урилгын үндсэн background болгон ашиглах зураг.
                    </p>
                  </div>

                  {backgroundImage ? (
                    <div className="relative mt-6 overflow-hidden rounded-3xl border border-black/10">
                      <img
                        src={backgroundImage}
                        alt="Background preview"
                        className="h-64 w-full object-cover"
                      />

                      <button
                        type="button"
                        onClick={
                          removeBackground
                        }
                        className="absolute right-3 top-3 rounded-full bg-black/75 px-4 py-2 text-xs font-medium text-white backdrop-blur transition hover:bg-black"
                      >
                        Зураг устгах
                      </button>
                    </div>
                  ) : (
                    <label className="mt-6 flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-black/15 bg-[#F8F5F0] px-6 py-12 text-center transition hover:border-black/30 hover:bg-[#F4EFE8]">
                      <div className="text-3xl">
                        🖼️
                      </div>

                      <div className="mt-4 text-sm font-semibold">
                        Background зураг сонгох
                      </div>

                      <div className="mt-2 text-xs text-black/40">
                        JPG, PNG, WEBP
                      </div>

                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        data-role="background-image"
                        onChange={
                          handleBackgroundUpload
                        }
                        className="hidden"
                      />
                    </label>
                  )}

                  {backgroundImage && (
                    <label className="mt-4 inline-flex cursor-pointer rounded-full border border-black/10 bg-white px-4 py-2.5 text-xs font-semibold transition hover:bg-black/5">
                      Background солих

                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        data-role="background-image"
                        onChange={
                          handleBackgroundUpload
                        }
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* GALLERY */}

                <div className="rounded-[28px] border border-black/10 bg-white p-6 shadow-sm sm:p-7">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold">
                        Gallery зураг
                      </h2>

                      <p className="mt-1 text-sm text-black/40">
                        Урилгандаа оруулах нэмэлт зурагнуудаа сонгоно уу.
                      </p>
                    </div>

                    <label className="cursor-pointer rounded-full bg-black px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-black/80">
                      + Зураг нэмэх

                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        data-role="gallery-images"
                        onChange={
                          handleGalleryUpload
                        }
                        className="hidden"
                      />
                    </label>
                  </div>

                  {gallery.length ===
                  0 ? (
                    <div className="mt-6 rounded-3xl border border-dashed border-black/15 bg-[#F8F5F0] px-6 py-10 text-center">
                      <div className="text-3xl">
                        📸
                      </div>

                      <div className="mt-3 text-sm font-medium">
                        Одоогоор зураг алга
                      </div>

                      <div className="mt-1 text-xs text-black/40">
                        Нэг эсвэл олон зураг сонгож болно.
                      </div>
                    </div>
                  ) : (
                    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {gallery.map(
                        (photo, index) => (
                          <div
                            key={
                              photo.id
                            }
                            draggable
                            onDragStart={() =>
                              setDragIndex(index)
                            }
                            onDragOver={(event) =>
                              event.preventDefault()
                            }
                            onDrop={() => {
                              if (dragIndex !== null) {
                                moveGalleryPhoto(
                                  dragIndex,
                                  index
                                );
                              }

                              setDragIndex(null);
                            }}
                            onDragEnd={() =>
                              setDragIndex(null)
                            }
                            className={`group cursor-grab rounded-2xl bg-[#F8F5F0] ${
                              dragIndex === index
                                ? "opacity-40"
                                : ""
                            }`}
                          >
                            {/* IMAGE */}

                            <div className="relative aspect-square overflow-hidden rounded-2xl">
                              <img
                                src={
                                  photo.url
                                }
                                alt={
                                  photo.caption ||
                                  "Gallery"
                                }
                                draggable={false}
                                className="h-full w-full object-cover"
                              />

                              {index === 0 && (
                                <span className="absolute left-2 top-2 rounded-full bg-black/75 px-2.5 py-1 text-[10px] font-semibold text-white">
                                  Нүүр
                                </span>
                              )}

                              <div className="absolute inset-x-2 bottom-2 flex justify-between opacity-100 sm:opacity-0 sm:transition sm:group-hover:opacity-100">
                                <button
                                  type="button"
                                  aria-label="Өмнө нь зөөх"
                                  disabled={index === 0}
                                  onClick={() =>
                                    moveGalleryPhoto(
                                      index,
                                      index - 1
                                    )
                                  }
                                  className="rounded-full bg-black/75 px-2.5 py-1 text-xs text-white disabled:opacity-30"
                                >
                                  ←
                                </button>

                                <button
                                  type="button"
                                  aria-label="Хойно нь зөөх"
                                  disabled={
                                    index ===
                                    gallery.length - 1
                                  }
                                  onClick={() =>
                                    moveGalleryPhoto(
                                      index,
                                      index + 1
                                    )
                                  }
                                  className="rounded-full bg-black/75 px-2.5 py-1 text-xs text-white disabled:opacity-30"
                                >
                                  →
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  removeGalleryPhoto(
                                    photo.id
                                  )
                                }
                                className="absolute right-2 top-2 rounded-full bg-black/75 px-2.5 py-1.5 text-xs text-white opacity-100 backdrop-blur transition sm:opacity-0 sm:group-hover:opacity-100"
                              >
                                ✕
                              </button>
                            </div>

                            {/* CAPTION */}

                            <div className="pt-2">
                              <label className="mb-1.5 block text-xs font-semibold text-black/55">
                                Зургийн тайлбар
                              </label>

                              <input
                                type="text"
                                value={
                                  photo.caption
                                }
                                onChange={(event) => {
                                  const value =
                                    event.target.value;

                                  setGallery(
                                    (current) =>
                                      current.map(
                                        (item) =>
                                          item.id ===
                                          photo.id
                                            ? {
                                                ...item,
                                                caption:
                                                  value,
                                              }
                                            : item
                                      )
                                  );
                                }}
                                placeholder="Жишээ: Бидний анхны аялал 🤍"
                                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-xs text-black outline-none placeholder:text-black/30 focus:border-black/25"
                              />
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>

                <VideoAndMusic
                  extras={extras}
                  onChange={patchExtras}
                  coverVideo={coverVideo}
                  onCoverVideo={setCoverVideo}
                />

                {/* MUSIC */}

                {(!coverVideo || musicFile) && (
                  <div className="rounded-[28px] border border-black/10 bg-white p-6 shadow-sm sm:p-7">
                    <div>
                      <h2 className="text-lg font-semibold">
                        Урилгын дуу
                      </h2>

                      <p className="mt-1 text-sm text-black/40">
                        Урилгаа нээхэд тоглуулах дуугаа MP3 хэлбэрээр оруулна уу.
                      </p>
                    </div>

                    {!musicFile ? (
                      <label className="mt-6 flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-black/15 bg-[#F8F5F0] px-6 py-10 text-center transition hover:border-black/30 hover:bg-[#F4EFE8]">
                        <div className="text-3xl">
                          🎵
                        </div>

                        <div className="mt-4 text-sm font-semibold">
                          MP3 дуу сонгох
                        </div>

                        <div className="mt-2 text-xs text-black/40">
                          MP3 · 20MB хүртэл
                        </div>

                        <input
                          type="file"
                          accept="audio/mpeg,audio/mp3,.mp3"
                          data-role="invitation-music"
                          onChange={
                            handleMusicUpload
                          }
                          className="hidden"
                        />
                      </label>
                    ) : (
                      <div className="mt-6 rounded-3xl border border-black/10 bg-[#F8F5F0] p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black text-white">
                                🎵
                              </span>

                              <div className="min-w-0">
                                <div className="truncate text-sm font-semibold">
                                  {musicFile.name}
                                </div>

                                <div className="mt-1 text-xs text-black/40">
                                  MP3 ·{" "}
                                  {(
                                    musicFile.size /
                                    1024 /
                                    1024
                                  ).toFixed(1)}
                                  {" "}MB
                                </div>
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={
                              removeMusic
                            }
                            className="shrink-0 rounded-full bg-black/10 px-3 py-2 text-xs font-semibold transition hover:bg-black/15"
                          >
                            Устгах
                          </button>
                        </div>

                        {musicUrl && (
                          <audio
                            controls
                            src={musicUrl}
                            className="mt-5 w-full"
                          />
                        )}

                        <label className="mt-4 inline-flex cursor-pointer rounded-full border border-black/10 bg-white px-4 py-2.5 text-xs font-semibold transition hover:bg-black/5">
                          Дуу солих

                          <input
                            type="file"
                            accept="audio/mpeg,audio/mp3,.mp3"
                            data-role="invitation-music"
                            onChange={
                              handleMusicUpload
                            }
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}

                    <div className="mt-4 rounded-2xl bg-[#F8F5F0] px-4 py-3 text-xs leading-5 text-black/45">
                      💡 Public урилга дээр browser-ийн autoplay
                      хязгаарлалтаас шалтгаалж хэрэглэгч нэг удаа
                      дэлгэц дээр дарахад дуу эхлэх боломжтой.
                    </div>
                  </div>
                )}
              </>
            )}

            {/* CONTINUE */}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  step === 2
                    ? setStep(1)
                    : window.history.back()
                }
                className="rounded-full border border-black/10 bg-white px-6 py-3.5 text-sm font-semibold transition hover:bg-black/5"
              >
                ← Буцах
              </button>

              <button
                type="button"
                onClick={
                  step === 1
                    ? () => setStep(2)
                    : handleContinue
                }
                disabled={
                  savingImages
                }
                className="rounded-full bg-black px-7 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingImages
                  ? "Зураг, дуу хадгалж байна..."
                  : "Үргэлжлүүлэх →"}
              </button>
            </div>
          </section>

          {/* RIGHT — LIVE PREVIEW */}

          <aside className="lg:sticky lg:top-6 lg:h-fit">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-black/35">
                  Live Preview
                </div>

                <div className="mt-1 text-sm font-semibold">
                  Урилга
                </div>
              </div>

              <div className="rounded-full bg-green-50 px-3 py-1.5 text-[10px] font-semibold text-green-700">
                LIVE
              </div>
            </div>

            <div className="mx-auto w-full max-w-[390px] rounded-[38px] border-[8px] border-[#171717] bg-[#171717] p-1.5 shadow-2xl shadow-black/20">
              <div className="relative aspect-[9/18] overflow-hidden rounded-[30px] bg-[#EEE6DA]">
                {/* BACKGROUND */}

                {backgroundImage && (
                  <img
                    src={backgroundImage}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                )}

                <div
                  className={`absolute inset-0 ${
                    backgroundImage
                      ? "bg-black/30"
                      : "bg-gradient-to-b from-[#F3E9DC] via-[#EEE6DA] to-[#E3D4C2]"
                  }`}
                />

                {/* PREVIEW CONTENT */}

                <div className="relative z-10 flex h-full flex-col items-center justify-between px-7 py-12 text-center text-white">
                  <div className="text-[9px] font-medium tracking-[0.35em] text-white/80">
                    {title ||
                      exampleData.title}
                  </div>

                  <div>
                    <div className="font-serif text-4xl italic drop-shadow-sm">
                      {names ||
                        exampleData.names}
                    </div>

                    <div className="mt-4 text-[10px] tracking-[0.2em] text-white/75">
                      {formattedDate ||
                        "2027 оны 6 сарын 20"}{" "}
                      {time
                        ? `· ${time}`
                        : ""}
                    </div>
                  </div>

                  <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-white/70 bg-white/20 shadow-xl backdrop-blur-sm">
                    {gallery[0] ? (
                      <img
                        src={
                          gallery[0].url
                        }
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-4xl">
                        {getEventIcon(eventType)}
                      </span>
                    )}
                  </div>

                  <div className="max-w-[250px]">
                    <p className="text-xs leading-5 text-white/85">
                      {message ||
                        exampleData.message}
                    </p>

                    <div className="mt-5 text-xs font-medium">
                      📍{" "}
                      {venue ||
                        exampleData.venue}
                    </div>

                    <div className="mt-1 text-[10px] text-white/65">
                      {address ||
                        exampleData.address}
                    </div>
                  </div>

                  {gallery.length >
                    1 && (
                    <div className="flex gap-1.5">
                      {gallery
                        .slice(
                          0,
                          4
                        )
                        .map(
                          (
                            photo
                          ) => (
                            <img
                              key={
                                photo.id
                              }
                              src={
                                photo.url
                              }
                              alt=""
                              className="h-8 w-8 rounded-full border border-white/50 object-cover"
                            />
                          )
                        )}
                    </div>
                  )}

                  {/* MUSIC INDICATOR */}

                  {musicFile && (
                    <div className="flex items-center gap-2 rounded-full bg-black/30 px-3 py-1.5 text-[9px] text-white/90 backdrop-blur-sm">
                      <span className="animate-pulse">
                        ♪
                      </span>

                      <span className="max-w-[150px] truncate">
                        {musicFile.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mx-auto mt-4 max-w-[390px] text-center text-xs leading-5 text-black/35">
              Урилгын мэдээллийг өөрчлөхөд preview автоматаар шинэчлэгдэнэ.
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

export default function InvitationDetailsPage() {
  return (
    <Suspense fallback={null}>
      <InvitationDetailsPageContent />
    </Suspense>
  );
}