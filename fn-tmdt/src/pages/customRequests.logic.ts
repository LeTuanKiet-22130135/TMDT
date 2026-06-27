export interface Message {
  id: string;
  sender: 'client' | 'you' | 'system';
  title?: string;
  badges?: string[];
  content: string;
  time: string;
  isInvoice?: boolean;
  isUploadAction?: boolean;
}

export interface TicketInfo {
  id: string;
  clientName: string;
  avatar: string;
  ticketCode: string;
  status: string;
  messages: Message[];
}

export const useCustomRequestsData = () => {
  const ticketsData: Record<'elena' | 'arid', TicketInfo> = {
    elena: {
      id: 'elena',
      clientName: 'Elena V.',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCgjenSZvmWQAHLKLu_fM4v9SZRZ5DPygvM4mF4-TlaoifBbIrtbx7MeVFpDB2CgAiBf6Olwz4ICP4Plwu_0wfr6r-N-ww-oFnsUeOMkWFCZ156VXAI6-zoqaMlPVQ1cxNZRWipMYMI9hvlB-aSrTz6cDJdt8v8cD9ZCeRcDBa5cSyGFLiMuffdtl8AbMa4HtDhvfdC3NwkAjOw2DAoum7ndBfvubfjy3t0mN2xPJZoRVeP1VS6yiFtETW8eVGimEItoeJTxP4ONZFz',
      ticketCode: '#DEKO0132',
      status: 'ĐANG XỬ LÝ',
      messages: [
        {
          id: 'm1',
          sender: 'client',
          title: 'Max đã yêu cầu custom.',
          badges: ['IN'],
          content: 'Mô tả yêu cầu: Gì đó. ABC',
          time: '11:00 AM'
        },
        {
          id: 'm2',
          sender: 'client',
          title: 'Max đã sửa yêu cầu.',
          badges: ['IN', 'STANDE'],
          content: 'Mô tả yêu cầu: Gì đó. ABC',
          time: '11:05 AM'
        },
        {
          id: 'm3',
          sender: 'you',
          content: 'Tiền công là 10.000 VND. Bạn có đồng ý.',
          time: '11:10 AM'
        },
        {
          id: 'm4',
          sender: 'system',
          content: 'Max đã đồng ý.',
          time: '11:12 AM'
        },
        {
          id: 'm5',
          sender: 'system',
          content: '',
          time: '11:15 AM',
          isInvoice: true
        },
        {
          id: 'm6',
          sender: 'you',
          content: '',
          time: '11:20 AM',
          isUploadAction: true
        }
      ]
    },
    arid: {
      id: 'arid',
      clientName: 'Studio Arid',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBtluSThhnYoePmLDCRSU_GSBw_VfMQOONhTs6eucDvi1uYfU4rza65Lv6DBt6uciYczZ_bd5vRt2l6I24Q7fwuYsCKfmcLlvVF2KV1VhuJefl8tRYscgLUqaMUsxLIoQLrUigKjfzEk_jMC6wMh9Y_Mgb-drl2_Liexezmv9Yn2VGaM39HcuzwTEFej7TkDTsJtso_iN_a2bxozXFhwrev1ozNole7eA-wFH4Zf9398W91JQ0AMxWkUednwnLrNNUE9KbtqIzSlgMg',
      ticketCode: '#ARID0099',
      status: 'ĐÃ HOÀN TẤT',
      messages: [
        {
          id: 'a1',
          sender: 'client',
          title: 'Studio Arid đã yêu cầu custom.',
          badges: ['TỐI ƯU 3D'],
          content: 'Yêu cầu tối ưu lại mô hình lưới cho nhân vật VTuber.',
          time: '09:00 AM'
        },
        {
          id: 'a2',
          sender: 'you',
          content: 'Giá dịch vụ tối ưu là 50.000 VND. Cần 3 ngày hoàn thành.',
          time: '09:30 AM'
        },
        {
          id: 'a3',
          sender: 'system',
          content: 'Studio Arid đã đồng ý thanh toán.',
          time: '09:35 AM'
        }
      ]
    }
  };

  return { ticketsData };
};
