import { SustainedAttention } from "./tracker/cognitive-attention";

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "ATTENTION_UPDATE") {
    const { data } = message;

    const sustainedAttention: SustainedAttention = data;
    console.log({ sustainedAttention });
  }

  return true;
});
