export interface Asset {
  id: string;
  title: string;
  author: string;
  authorHandle: string;
  authorAvatar: string;
  authorFollowers: string;
  category: string;
  price: number;
  imageUrl: string;
  images: string[];
  imageAlt: string;
  tags: string[];
  rating: number;
  reviewsCount: number;
  description: string;
}

export const useHomeData = () => {
  const assets: Asset[] = [
    {
      id: "1",
      title: "Trang phục Nữ Vu",
      author: "blueneko",
      authorHandle: "@blueneko",
      authorAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAJcjaFmuI06E2-7RyXXIWRgu0pKEvl_fyyWOEeyR8mli5DQG8Uws5CnhZwAKSicULujuUboDm2JjWQYcysyRZ5VOXloklP7R4Z9M9AqDhWfrefpdnufffJ3l2lYlRZ20JxHnagMBBgbfrcfAGR2nbwsRd2VJ3O5arbx4KcTx_6wHfglqmwEeCHF_lVvjjIZs-gxmSIDTq7nXchKPLOedlmYrH9T-HEoTVSuS50ZJVYy7YHbFpijGN24pFDx_8uqWhpVNzAGY1BFjrk",
      authorFollowers: "3.6k",
      category: "Trang phục 3D",
      price: 10000,
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBoMSEqBgmIlR3-ZVT3MOw7mGuxh-cXI0xEkX8jPDZVcZZpzel0rWMZQTiOTXDYPF36cYnn22SIqGx5sd4LM0MYqSN_Lma0v7x-watFGvn-oswASjN1QYLqHy8ms_jKY5CQSUd7aSeLGK5XruBOm91yGW_H2OSjjPhUofKlA_FWQTdMWk2kUbFygGb43LforzaL70B4_a9_Tsc5st9TYjJkmBtEA1ExOBBZ0iKEQf9weLUGL5kO9FO7P1F0PYVbv4gQJn0n3iJbIx8M",
      images: [
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBoMSEqBgmIlR3-ZVT3MOw7mGuxh-cXI0xEkX8jPDZVcZZpzel0rWMZQTiOTXDYPF36cYnn22SIqGx5sd4LM0MYqSN_Lma0v7x-watFGvn-oswASjN1QYLqHy8ms_jKY5CQSUd7aSeLGK5XruBOm91yGW_H2OSjjPhUofKlA_FWQTdMWk2kUbFygGb43LforzaL70B4_a9_Tsc5st9TYjJkmBtEA1ExOBBZ0iKEQf9weLUGL5kO9FO7P1F0PYVbv4gQJn0n3iJbIx8M",
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCeNdhNxlp0hbpB9PBlwxavVi7EnNQ0sUTFqLsbJHBQuDIm6mmsD5jkkC44m40rt_2C3N0tBFfIGCAHdqTFt-txZ0hVhALyE800RZd-C-MOE9CQNWEdBPMugQqiJ0aWLJAxC8Kb5wpQadxYXY1V4jfkdv7RQJBybp-4wTAqcqO3Xr46-GfQfZkAN7su8d2ajIGULMR0if7yBEggVqFebiebNIXQtounWuSyQbvutpdQKNT01g-Z8-XL5VHKSAOXqj8VM2xSaoD6nPD4",
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBG4e6neGlFzXsFbOCFASbqHuyyusw43ybeysaFTAkzMk7zKtY6XtGM42jFuS4l6yDziQAMWBfXjxm0VtIj93WusbiP953lUTirDq8ZIhjIKKlByUepqgHMXjuXNMxkI0VCEdMJH2aQ6N_vTfZxHAQkTEAf8AsaB36SdOXOaL09mz7nv8cCELjNX4OVGu_RlJ2kDdlPk8CVqr8PY66KEVBGlTlh7BMOZVbhAR-ipTfsvseO2PmrcRF1sOa1KcK-lfiW7qQJBl620cqi",
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAR7fAR2CFUgSPQ5AdrMbsb9m-KED0WKD-OomEx6gYIgTbQBAL7CLrYjTy1sSwmfb7y-AIUgE0SbjR_3phu8HYoG9ETEt2Z-FskDsTkwb86RhxRQVynR2LDRdLyjc-J70oJKjTjykUxbtBerFHxb2bx-Zl5sJGC2yua9ahEjeBvl7DAJJKNE7huo6gLo0SmhJMs_HuZjpn8vFOfmYM05UJgDkwGMM9XkgB1V3Og5Pu5_Z4HbIcM9b5sXSePpsbWx527PKW9pTG7W-O4"
      ],
      imageAlt: "Mẫu trang phục Nữ Vu Nhật Bản",
      tags: ["TAG 1", "TAG 2"],
      rating: 4.8,
      reviewsCount: 124,
      description: "Đây là một mô tả dài vl. Nà ná nà na. Thiết kế lấy cảm hứng từ trang phục truyền thống của đền thờ Thần đạo Nhật Bản, được tối ưu hóa cho các mô hình VTuber 3D."
    },
    {
      id: "2",
      title: "Mô hình Thủy thủ Tương lai",
      author: "Elena V.",
      authorHandle: "@elenav",
      authorAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCgjenSZvmWQAHLKLu_fM4v9SZRZ5DPygvM4mF4-TlaoifBbIrtbx7MeVFpDB2CgAiBf6Olwz4ICP4Plwu_0wfr6r-N-ww-oFnsUeOMkWFCZ156VXAI6-zoqaMlPVQ1cxNZRWipMYMI9hvlB-aSrTz6cDJdt8v8cD9ZCeRcDBa5cSyGFLiMuffdtl8AbMa4HtDhvfdC3NwkAjOw2DAoum7ndBfvubfjy3t0mN2xPJZoRVeP1VS6yiFtETW8eVGimEItoeJTxP4ONZFz",
      authorFollowers: "2.1k",
      category: "VTuber Model",
      price: 250000,
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAR7fAR2CFUgSPQ5AdrMbsb9m-KED0WKD-OomEx6gYIgTbQBAL7CLrYjTy1sSwmfb7y-AIUgE0SbjR_3phu8HYoG9ETEt2Z-FskDsTkwb86RhxRQVynR2LDRdLyjc-J70oJKjTjykUxbtBerFHxb2bx-Zl5sJGC2yua9ahEjeBvl7DAJJKNE7huo6gLo0SmhJMs_HuZjpn8vFOfmYM05UJgDkwGMM9XkgB1V3Og5Pu5_Z4HbIcM9b5sXSePpsbWx527PKW9pTG7W-O4",
      images: [
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAR7fAR2CFUgSPQ5AdrMbsb9m-KED0WKD-OomEx6gYIgTbQBAL7CLrYjTy1sSwmfb7y-AIUgE0SbjR_3phu8HYoG9ETEt2Z-FskDsTkwb86RhxRQVynR2LDRdLyjc-J70oJKjTjykUxbtBerFHxb2bx-Zl5sJGC2yua9ahEjeBvl7DAJJKNE7huo6gLo0SmhJMs_HuZjpn8vFOfmYM05UJgDkwGMM9XkgB1V3Og5Pu5_Z4HbIcM9b5sXSePpsbWx527PKW9pTG7W-O4",
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBG4e6neGlFzXsFbOCFASbqHuyyusw43ybeysaFTAkzMk7zKtY6XtGM42jFuS4l6yDziQAMWBfXjxm0VtIj93WusbiP953lUTirDq8ZIhjIKKlByUepqgHMXjuXNMxkI0VCEdMJH2aQ6N_vTfZxHAQkTEAf8AsaB36SdOXOaL09mz7nv8cCELjNX4OVGu_RlJ2kDdlPk8CVqr8PY66KEVBGlTlh7BMOZVbhAR-ipTfsvseO2PmrcRF1sOa1KcK-lfiW7qQJBl620cqi"
      ],
      imageAlt: "Mẫu Live2D phong cách anime hiện đại",
      tags: ["LIVE2D", "ANIME"],
      rating: 4.9,
      reviewsCount: 88,
      description: "Mẫu Live2D chất lượng cao được chuẩn bị đầy đủ các tệp chuyển động (rigging) cho khuôn mặt và cơ thể. Sẵn sàng phát sóng trực tiếp."
    },
    {
      id: "3",
      title: "Thiết kế đầm dạ hội Goth",
      author: "Studio Arid",
      authorHandle: "@studioarid",
      authorAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBtluSThhnYoePmLDCRSU_GSBw_VfMQOONhTs6eucDvi1uYfU4rza65Lv6DBt6uciYczZ_bd5vRt2l6I24Q7fwuYsCKfmcLlvVF2KV1VhuJefl8tRYscgLUqaMUsxLIoQLrUigKjfzEk_jMC6wMh9Y_Mgb-drl2_Liexezmv9Yn2VGaM39HcuzwTEFej7TkDTsJtso_iN_a2bxozXFhwrev1ozNole7eA-wFH4Zf9398W91JQ0AMxWkUednwnLrNNUE9KbtqIzSlgMg",
      authorFollowers: "12.5k",
      category: "Texture Pack",
      price: 20000,
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDaijwBTDFd2pJwueDQwOubHRl6H_qbg7Vsiso1mrZshSKNwloAO16C34G6ptnF-_w-FxmzYWLD33eLJwj_idtO5sCiWLPnxT4FJKmruQ24CtY2qRQCbHmjrBw2P5iOUIer5qHMwA5PV_8kuU3T0faqW9ibgVTGq-mB6Y8-Ok2ONITREr-LYfsK-tT_JA8Yzl-lXjZGKoiGiTg4u2JX-Ca-OZfrLnRdfNpwIyQ1WxEmA9PPa61ncvpvg525BNjUIQLalJkETRiObFVB",
      images: [
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDaijwBTDFd2pJwueDQwOubHRl6H_qbg7Vsiso1mrZshSKNwloAO16C34G6ptnF-_w-FxmzYWLD33eLJwj_idtO5sCiWLPnxT4FJKmruQ24CtY2qRQCbHmjrBw2P5iOUIer5qHMwA5PV_8kuU3T0faqW9ibgVTGq-mB6Y8-Ok2ONITREr-LYfsK-tT_JA8Yzl-lXjZGKoiGiTg4u2JX-Ca-OZfrLnRdfNpwIyQ1WxEmA9PPa61ncvpvg525BNjUIQLalJkETRiObFVB"
      ],
      imageAlt: "Đầm dạ hội phong cách Gothic ấn tượng",
      tags: ["GOTHIC", "TEXTURE"],
      rating: 4.7,
      reviewsCount: 45,
      description: "Gói texture chất lượng cao 4K phù hợp với nhiều loại trang phục 3D. Họa tiết thêu ren đen tinh xảo."
    },
    {
      id: "4",
      title: "Ảnh nền Tinh vân 4K",
      author: "Elena V.",
      authorHandle: "@elenav",
      authorAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCgjenSZvmWQAHLKLu_fM4v9SZRZ5DPygvM4mF4-TlaoifBbIrtbx7MeVFpDB2CgAiBf6Olwz4ICP4Plwu_0wfr6r-N-ww-oFnsUeOMkWFCZ156VXAI6-zoqaMlPVQ1cxNZRWipMYMI9hvlB-aSrTz6cDJdt8v8cD9ZCeRcDBa5cSyGFLiMuffdtl8AbMa4HtDhvfdC3NwkAjOw2DAoum7ndBfvubfjy3t0mN2xPJZoRVeP1VS6yiFtETW8eVGimEItoeJTxP4ONZFz",
      authorFollowers: "2.1k",
      category: "Backgrounds",
      price: 15000,
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBG4e6neGlFzXsFbOCFASbqHuyyusw43ybeysaFTAkzMk7zKtY6XtGM42jFuS4l6yDziQAMWBfXjxm0VtIj93WusbiP953lUTirDq8ZIhjIKKlByUepqgHMXjuXNMxkI0VCEdMJH2aQ6N_vTfZxHAQkTEAf8AsaB36SdOXOaL09mz7nv8cCELjNX4OVGu_RlJ2kDdlPk8CVqr8PY66KEVBGlTlh7BMOZVbhAR-ipTfsvseO2PmrcRF1sOa1KcK-lfiW7qQJBl620cqi",
      images: [
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBG4e6neGlFzXsFbOCFASbqHuyyusw43ybeysaFTAkzMk7zKtY6XtGM42jFuS4l6yDziQAMWBfXjxm0VtIj93WusbiP953lUTirDq8ZIhjIKKlByUepqgHMXjuXNMxkI0VCEdMJH2aQ6N_vTfZxHAQkTEAf8AsaB36SdOXOaL09mz7nv8cCELjNX4OVGu_RlJ2kDdlPk8CVqr8PY66KEVBGlTlh7BMOZVbhAR-ipTfsvseO2PmrcRF1sOa1KcK-lfiW7qQJBl620cqi"
      ],
      imageAlt: "Hình nền mượt mà độ phân giải 4K",
      tags: ["BACKGROUND", "SPACE"],
      rating: 4.6,
      reviewsCount: 37,
      description: "Hình nền chủ đề không gian trừu tượng với độ phân giải siêu nét 4K, hoàn hảo để làm hình nền livestream hoặc banner."
    }
  ];

  return { assets };
};
