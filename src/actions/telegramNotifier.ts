const API_TOKEN = '5804306742:AAEDyC6-aAuhW90lxVxCYJ72_f8IrtYlcxc'; // Replace with your actual API token
const CHAT_ID = '404269833'; // Replace with the chat ID or username of the recipient
const API_URL = `https://api.telegram.org/bot${API_TOKEN}/sendMessage`;

export const sendMessage = async (message: string) => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text: message,
    }),
  })
    .then(response => {
      if (response.ok) {
        console.log('Message sent successfully');
      } else {
        console.error('Error sending message:', response.status, response.statusText);
      }
    })
    .catch(error => {
      console.error('Error sending message:', error);
    });
}