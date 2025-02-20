import { defer } from "react-router-dom";

export const singlePageLoader = async ({ params }) => {
  const res = await fetch(`/posts/${params.id}`);
  const data = await res.json();
  return data;
};

export const listPageLoader = async () => {
  try {
    const postPromise = fetch(`/posts`).then((res) => res.json());
    return defer({
      postResponse: postPromise,
    });
  } catch (error) {
    console.error(error);
  }
};

export const profilePageLoader = async () => {
  const postPromise = fetch("/users/profilePosts").then((res) => res.json());
  const chatPromise = fetch("/chats").then((res) => res.json());
  return defer({
    postResponse: postPromise,
    chatResponse: chatPromise,
  });
};
