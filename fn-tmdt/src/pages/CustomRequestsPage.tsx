import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Settings, HelpCircle, ArrowLeft, Bell, Download, Printer, Upload, CheckCircle, Send } from 'lucide-react';
import { Badge } from '../components/ui/Badge';

import { useCustomRequestsData } from './customRequests.logic';
import type { Message,  } from './customRequests.logic';

export const CustomRequestsPage: React.FC = () => {
  const [activeContact, setActiveContact] = useState<'elena' | 'arid'>('elena');
  const [searchContact, setSearchContact] = useState('');
  const [searchMessage, setSearchMessage] = useState('');
  
  // Trạng thái upload file mockup
  const [filePrintUploaded, setFilePrintUploaded] = useState<string | null>(null);
  const [fileStandeUploaded, setFileStandeUploaded] = useState<string | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Ô chat trực tiếp
  const [chatInputText, setChatInputText] = useState('');

  // Dữ liệu Ticket mẫu
  const { ticketsData } = useCustomRequestsData();

  const currentTicket = ticketsData[activeContact];

  const handleFileUpload = (type: 'print' | 'stande', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'print') {
        setFilePrintUploaded(file.name);
        console.log(`Print file uploaded: ${file.name}`);
      } else {
        setFileStandeUploaded(file.name);
        console.log(`Standee file uploaded: ${file.name}`);
      }
    }
  };

  const handleConfirmAction = () => {
    setIsConfirmed(true);
    console.log('User confirmed files verification status.');
    alert('Đã xác nhận tệp tin tải lên thành công!');
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInputText.trim()) return;
    
    // Thêm tin nhắn mới vào danh sách tin nhắn hoạt động
    const newMsg: Message = {
      id: `m-custom-${Date.now()}`,
      sender: 'you',
      content: chatInputText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    currentTicket.messages.push(newMsg);
    setChatInputText('');
    console.log(`Message sent: "${chatInputText}"`);
  };

  return (
    <div className="flex h-screen bg-[#FBFBFE] text-[#040316] overflow-hidden font-body antialiased">
      
      {/* 1. Sidebar bên trái (Lịch sử chat) */}
      <aside className="w-80 bg-surface-container-low border-r border-outline-variant/15 flex flex-col h-full shrink-0">
        
        {/* Header Sidebar */}
        <div className="p-6 border-b border-outline-variant/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#FFF1F3] flex items-center justify-center border border-[#FFD9E0] text-[#F65C88]">
              💬
            </div>
            <div>
              <h1 className="font-headline font-black text-sm text-[#F65C88] uppercase tracking-wide">Logo</h1>
              <p className="text-[10px] text-on-surface-variant/70 leading-none">Chế độ doanh nghiệp</p>
            </div>
          </div>
          
          {/* Ô tìm kiếm liên hệ */}
          <div className="mt-4 flex items-center bg-white border border-outline-variant/20 rounded-full px-3 py-1.5 focus-within:border-tertiary transition-colors">
            <Search size={16} className="text-on-surface-variant/60 mr-2" />
            <input 
              type="text" 
              placeholder="Tìm liên hệ..." 
              value={searchContact}
              onChange={(e) => setSearchContact(e.target.value)}
              className="w-full bg-transparent border-none text-xs focus:ring-0 outline-none text-on-surface"
            />
          </div>
        </div>

        {/* Danh sách Liên hệ */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <p className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant/40 px-2 mb-2">Lịch sử yêu cầu</p>
          
          {Object.values(ticketsData)
            .filter(t => t.clientName.toLowerCase().includes(searchContact.toLowerCase()))
            .map((ticket) => (
              <button
                key={ticket.id}
                onClick={() => {
                  setActiveContact(ticket.id as 'elena' | 'arid');
                  setIsConfirmed(false);
                  setFilePrintUploaded(null);
                  setFileStandeUploaded(null);
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${
                  activeContact === ticket.id 
                    ? 'bg-white shadow-sm border border-outline-variant/15 text-[#F65C88]' 
                    : 'hover:bg-surface-bright text-on-surface-variant'
                }`}
              >
                <img 
                  src={ticket.avatar} 
                  alt={ticket.clientName} 
                  className="w-10 h-10 rounded-full object-cover border border-white"
                />
                <div className="text-left flex-1 min-w-0">
                  <h4 className="font-semibold text-xs text-on-surface truncate">{ticket.clientName}</h4>
                  <p className="text-[10px] text-on-surface-variant/70 truncate mt-0.5">{ticket.ticketCode} • {ticket.status}</p>
                </div>
              </button>
            ))
          }
        </div>

        {/* Chân Sidebar */}
        <div className="p-4 border-t border-outline-variant/10 flex flex-col gap-1">
          <Link to="/" className="flex items-center gap-3 text-xs text-on-surface-variant hover:text-tertiary px-3 py-2 rounded-xl hover:bg-surface-bright transition-all">
            <ArrowLeft size={16} />
            <span>Trở lại trang chính</span>
          </Link>
          <a href="#" className="flex items-center gap-3 text-xs text-on-surface-variant hover:text-tertiary px-3 py-2 rounded-xl hover:bg-surface-bright transition-all">
            <Settings size={16} />
            <span>Cài đặt</span>
          </a>
          <a href="#" className="flex items-center gap-3 text-xs text-on-surface-variant hover:text-tertiary px-3 py-2 rounded-xl hover:bg-surface-bright transition-all">
            <HelpCircle size={16} />
            <span>Trợ giúp</span>
          </a>
        </div>

      </aside>

      {/* 2. Cột bên phải (Khung chat chính) */}
      <main className="flex-1 flex flex-col h-full bg-white">
        
        {/* Header Khung Chat */}
        <header className="px-8 py-4 border-b border-outline-variant/15 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="px-3 py-1 text-xs">
              TICKET: {currentTicket.ticketCode}
            </Badge>
            <div className="flex gap-4 text-xs font-semibold border-l border-outline-variant/15 pl-4">
              <button className="text-on-surface-variant/60 hover:text-tertiary">Tình trạng</button>
              <button className="text-tertiary border-b-2 border-tertiary pb-1 -mb-[18px]">Trò chuyện</button>
            </div>
          </div>

          <div className="flex items-center bg-surface-container-low rounded-full px-3 py-1.5 w-64">
            <Search size={14} className="text-on-surface-variant/50 mr-2" />
            <input 
              type="text" 
              placeholder="Tìm kiếm tin nhắn..." 
              value={searchMessage}
              onChange={(e) => setSearchMessage(e.target.value)}
              className="bg-transparent border-none text-xs w-full focus:ring-0 outline-none placeholder:text-on-surface-variant/40"
            />
          </div>

          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-surface-container-low rounded-full transition-all">
              <Bell size={18} className="text-on-surface-variant" />
            </button>
            <img 
              src={currentTicket.avatar} 
              alt={currentTicket.clientName} 
              className="w-8 h-8 rounded-full object-cover"
            />
          </div>
        </header>

        {/* Nội dung tin nhắn cuộn */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[#FBFBFE]">
          {currentTicket.messages
            .filter(m => m.content.toLowerCase().includes(searchMessage.toLowerCase()) || (m.title && m.title.toLowerCase().includes(searchMessage.toLowerCase())))
            .map((msg) => {
              if (msg.sender === 'client') {
                return (
                  <div key={msg.id} className="flex flex-col gap-1 max-w-lg">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs">{msg.title}</span>
                      {msg.badges?.map((b, idx) => (
                        <Badge key={idx} variant="warning" className="text-[9px] px-1.5 py-0.5">{b}</Badge>
                      ))}
                    </div>
                    <div className="bg-white border border-outline-variant/15 p-4 rounded-2xl rounded-tl-none shadow-sm text-sm">
                      {msg.content}
                    </div>
                    <span className="text-[10px] text-on-surface-variant/50 mt-0.5">{msg.time}</span>
                  </div>
                );
              } else if (msg.sender === 'you') {
                if (msg.isUploadAction) {
                  return (
                    <div key={msg.id} className="flex flex-col items-end gap-1 ml-auto max-w-lg w-full">
                      <span className="font-bold text-xs text-right text-on-surface-variant/80">Bạn</span>
                      <div className="bg-[#FFF1F3] border border-[#FFD9E0] p-5 rounded-2xl rounded-tr-none shadow-sm text-sm w-full space-y-4">
                        
                        {/* File 1: In */}
                        <div>
                          <p className="font-bold text-xs text-on-surface-variant">Tải lên ảnh In</p>
                          <div className="mt-2 flex items-center justify-between border border-dashed border-outline-variant/30 rounded-xl p-3 bg-white">
                            <span className="text-xs text-on-surface-variant truncate max-w-xs">
                              {filePrintUploaded || 'Chưa chọn tệp tin nào...'}
                            </span>
                            <label className="flex items-center gap-1.5 px-3 py-1 bg-[#F65C88] hover:bg-[#F65C88]/90 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-sm">
                              <Upload size={12} />
                              Tải tập tin
                              <input 
                                type="file" 
                                className="hidden" 
                                onChange={(e) => handleFileUpload('print', e)} 
                              />
                            </label>
                          </div>
                        </div>

                        {/* File 2: Standee */}
                        <div>
                          <p className="font-bold text-xs text-on-surface-variant">Tải lên ảnh Stande</p>
                          <p className="text-[10px] text-on-surface-variant/60">Ảnh stande cần phải là PNG trong suốt</p>
                          <div className="mt-2 flex items-center justify-between border border-dashed border-outline-variant/30 rounded-xl p-3 bg-white">
                            <span className="text-xs text-on-surface-variant truncate max-w-xs">
                              {fileStandeUploaded || 'Chưa chọn tệp tin nào...'}
                            </span>
                            <label className="flex items-center gap-1.5 px-3 py-1 bg-[#F65C88] hover:bg-[#F65C88]/90 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-sm">
                              <Upload size={12} />
                              Tải tập tin
                              <input 
                                type="file" 
                                className="hidden" 
                                onChange={(e) => handleFileUpload('stande', e)} 
                              />
                            </label>
                          </div>
                        </div>

                        {/* Xác nhận */}
                        <button
                          onClick={handleConfirmAction}
                          disabled={isConfirmed}
                          className={`w-full py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 ${
                            isConfirmed 
                              ? 'bg-emerald-500 text-white cursor-not-allowed' 
                              : 'bg-[#040316] text-white hover:opacity-90'
                          }`}
                        >
                          {isConfirmed ? (
                            <>
                              <CheckCircle size={14} />
                              Đã xác nhận và kiểm tra
                            </>
                          ) : (
                            'Tôi đã kiểm tra và xác nhận'
                          )}
                        </button>
                      </div>
                      <span className="text-[10px] text-on-surface-variant/50 mt-0.5">{msg.time}</span>
                    </div>
                  );
                }

                return (
                  <div key={msg.id} className="flex flex-col items-end gap-1 ml-auto max-w-lg">
                    <span className="font-bold text-xs text-right text-on-surface-variant/80">Bạn</span>
                    <div className="bg-[#FFF1F3] border border-[#FFD9E0] p-4 rounded-2xl rounded-tr-none shadow-sm text-sm text-on-surface">
                      {msg.content}
                    </div>
                    <span className="text-[10px] text-on-surface-variant/50 mt-0.5">{msg.time}</span>
                  </div>
                );
              } else {
                // System logs / alerts
                if (msg.isInvoice) {
                  return (
                    <div key={msg.id} className="flex justify-center my-6">
                      <div className="bg-white border-2 border-dashed border-outline-variant/30 rounded-3xl p-6 shadow-md w-full max-w-md space-y-4">
                        
                        {/* Hóa đơn header */}
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-black text-sm uppercase text-[#F65C88]">Logo</h3>
                            <p className="text-[9px] text-on-surface-variant/60">Hóa đơn điện tử</p>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-black">{currentTicket.ticketCode}</span>
                            <p className="text-[9px] text-on-surface-variant/60">Ngày 11 tháng 9 năm 2036</p>
                          </div>
                        </div>

                        {/* Badge hoàn tất */}
                        <div className="flex justify-center">
                          <Badge variant="success" className="px-4 py-1 text-[10px] font-bold tracking-wider">
                            ĐÃ HOÀN TẤT
                          </Badge>
                        </div>

                        {/* Bảng Dịch vụ */}
                        <div className="border-t border-b border-outline-variant/10 py-3 space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-on-surface-variant">Công dịch vụ</span>
                            <span className="font-bold">10.000 VND</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-on-surface-variant">In màu chất lượng A5</span>
                            <span className="font-bold">20.000 VND</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-on-surface-variant">Đế Stande acrylic 15cm</span>
                            <span className="font-bold">250.000 VND</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-on-surface-variant">Phí giao hàng nhanh</span>
                            <span className="font-semibold text-emerald-600">Miễn phí</span>
                          </div>
                        </div>

                        {/* Tổng chi phí */}
                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between text-on-surface-variant/80">
                            <span>Tạm tính</span>
                            <span>280.000 VND</span>
                          </div>
                          <div className="flex justify-between text-on-surface-variant/80">
                            <span>Phí dịch vụ</span>
                            <span>3.000 VND</span>
                          </div>
                          <div className="flex justify-between text-on-surface-variant/80">
                            <span>Thuế VAT (0%)</span>
                            <span>0 VND</span>
                          </div>
                          <div className="flex justify-between text-sm font-black text-tertiary border-t border-outline-variant/10 pt-2">
                            <span>Nhận được (Thực nhận)</span>
                            <span>277.000 VND</span>
                          </div>
                        </div>

                        {/* Nút In ấn và Download */}
                        <div className="flex gap-2 pt-2">
                          <button 
                            onClick={() => alert('Đang tải hóa đơn dạng PDF...')}
                            className="flex-1 py-2 border border-outline-variant/20 rounded-xl text-xs font-bold text-on-surface-variant hover:text-tertiary hover:border-tertiary transition-colors flex items-center justify-center gap-1.5"
                          >
                            <Download size={12} />
                            Download PDF
                          </button>
                          <button 
                            onClick={() => window.print()}
                            className="flex-1 py-2 border border-outline-variant/20 rounded-xl text-xs font-bold text-on-surface-variant hover:text-tertiary hover:border-tertiary transition-colors flex items-center justify-center gap-1.5"
                          >
                            <Printer size={12} />
                            Print
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={msg.id} className="flex justify-center my-2">
                    <Badge variant="muted" className="px-4 py-1 text-[10px] tracking-wide bg-surface-container-high/60">
                      {msg.content}
                    </Badge>
                  </div>
                );
              }
            })}
        </div>

        {/* Khung chat nhập tin nhắn dưới cùng */}
        <form onSubmit={handleSendMessage} className="p-6 bg-white border-t border-outline-variant/15 flex items-center gap-4 shrink-0">
          <input 
            type="text" 
            placeholder={`Gửi tin nhắn tới ${currentTicket.clientName}...`}
            value={chatInputText}
            onChange={(e) => setChatInputText(e.target.value)}
            className="flex-1 bg-surface-container-low border border-outline-variant/20 rounded-full px-5 py-3 text-sm focus:border-tertiary focus:outline-none transition-colors placeholder:text-on-surface-variant/40 text-on-surface"
          />
          <button 
            type="submit"
            className="p-3 bg-[#F65C88] hover:bg-[#F65C88]/90 text-white rounded-full shadow-md hover:scale-105 active:scale-100 transition-all"
          >
            <Send size={18} />
          </button>
        </form>

      </main>

    </div>
  );
};
export default CustomRequestsPage;
