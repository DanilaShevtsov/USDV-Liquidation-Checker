import axios from 'axios';


export const sendMessage = async (message: string, apiKey: string, chatId: string, silent: boolean) => {
  const API_URL = `https://api.telegram.org/bot${apiKey}/sendMessage`;
  await axios.post(API_URL, {
    chat_id: chatId,
    text: message,
    parse_mode: 'markdown',
    disable_notification: silent
  })
    .then(response => {
      console.log('Message sent successfully');
    })
    .catch(error => {
      console.error('Error sending message:', error);
    });
}