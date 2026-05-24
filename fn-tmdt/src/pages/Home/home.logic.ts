export interface Asset {
  id: string;
  title: string;
  author: string;
  category: string;
  price: number;
  imageUrl: string;
  imageAlt: string;
}

export const useHomeData = () => {
  // Giả lập API gọi dữ liệu
  const assets: Asset[] = [
    {
      id: "1",
      title: "Ethereal Silk Flow",
      author: "Studio Arid",
      category: "3D Mesh Pack",
      price: 45,
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBoMSEqBgmIlR3-ZVT3MOw7mGuxh-cXI0xEkX8jPDZVcZZpzel0rWMZQTiOTXDYPF36cYnn22SIqGx5sd4LM0MYqSN_Lma0v7x-watFGvn-oswASjN1QYLqHy8ms_jKY5CQSUd7aSeLGK5XruBOm91yGW_H2OSjjPhUofKlA_FWQTdMWk2kUbFygGb43LforzaL70B4_a9_Tsc5st9TYjJkmBtEA1ExOBBZ0iKEQf9weLUGL5kO9FO7P1F0PYVbv4gQJn0n3iJbIx8M",
      imageAlt: "Abstract 3D digital render"
    },
    {
      id: "2",
      title: "Prismatic Glass V.2",
      author: "Elena V.",
      category: "Interactive Asset",
      price: 120,
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAR7fAR2CFUgSPQ5AdrMbsb9m-KED0WKD-OomEx6gYIgTbQBAL7CLrYjTy1sSwmfb7y-AIUgE0SbjR_3phu8HYoG9ETEt2Z-FskDsTkwb86RhxRQVynR2LDRdLyjc-J70oJKjTjykUxbtBerFHxb2bx-Zl5sJGC2yua9ahEjeBvl7DAJJKNE7huo6gLo0SmhJMs_HuZjpn8vFOfmYM05UJgDkwGMM9XkgB1V3Og5Pu5_Z4HbIcM9b5sXSePpsbWx527PKW9pTG7W-O4",
      imageAlt: "Dynamic 3D glass sculpture"
    },
    {
      id: "3",
      title: "Organic Earth Textures",
      author: "Studio Arid",
      category: "PBR Library",
      price: 25,
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDaijwBTDFd2pJwueDQwOubHRl6H_qbg7Vsiso1mrZshSKNwloAO16C34G6ptnF-_w-FxmzYWLD33eLJwj_idtO5sCiWLPnxT4FJKmruQ24CtY2qRQCbHmjrBw2P5iOUIer5qHMwA5PV_8kuU3T0faqW9ibgVTGq-mB6Y8-Ok2ONITREr-LYfsK-tT_JA8Yzl-lXjZGKoiGiTg4u2JX-Ca-OZfrLnRdfNpwIyQ1WxEmA9PPa61ncvpvg525BNjUIQLalJkETRiObFVB",
      imageAlt: "Monochromatic textured clay sculpture"
    },
    {
      id: "4",
      title: "Fluid Dreams 04",
      author: "Elena V.",
      category: "4K Background",
      price: 68,
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBG4e6neGlFzXsFbOCFASbqHuyyusw43ybeysaFTAkzMk7zKtY6XtGM42jFuS4l6yDziQAMWBfXjxm0VtIj93WusbiP953lUTirDq8ZIhjIKKlByUepqgHMXjuXNMxkI0VCEdMJH2aQ6N_vTfZxHAQkTEAf8AsaB36SdOXOaL09mz7nv8cCELjNX4OVGu_RlJ2kDdlPk8CVqr8PY66KEVBGlTlh7BMOZVbhAR-ipTfsvseO2PmrcRF1sOa1KcK-lfiW7qQJBl620cqi",
      imageAlt: "Vibrant abstract fluid art"
    },
    {
      id: "5",
      title: "Geometric Bliss",
      author: "Studio Arid",
      category: "Vector Patterns",
      price: 15,
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCeNdhNxlp0hbpB9PBlwxavVi7EnNQ0sUTFqLsbJHBQuDIm6mmsD5jkkC44m40rt_2C3N0tBFfIGCAHdqTFt-txZ0hVhALyE800RZd-C-MOE9CQNWEdBPMugQqiJ0aWLJAxC8Kb5wpQadxYXY1V4jfkdv7RQJBybp-4wTAqcqO3Xr46-GfQfZkAN7su8d2ajIGULMR0if7yBEggVqFebiebNIXQtounWuSyQbvutpdQKNT01g-Z8-XL5VHKSAOXqj8VM2xSaoD6nPD4",
      imageAlt: "Clean geometric vector pattern"
    },
    {
      id: "6",
      title: "Stark Geometry",
      author: "Elena V.",
      category: "Stock Photo",
      price: 89,
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuB5sXG1ScGjEEmxqkh_6WYUzZTUy4udxMm3s2aRj89rvzMGXeK6m3CfzOlBZXudEHaP2dIYTp5O1wbbKwlSX9yrPNrpIG3m7-hOyCpqSpw_jUyL0jRomvmipq24JORO8r30QS0Cebd6by85MnnC6ZtOtLXpulWgc9fB53nwLZNaKCqG0HoDZ2fMa1uBabEwVfE-Ol9-zfITPiW9BHGzDPtrM3gHjyH8bv9wiU2MsPIXH-uw0iC8jlny6pwaQZ0UBGktypAGLiLOeSwh",
      imageAlt: "Minimalist architectural photo"
    }
  ];

  return { assets };
};
