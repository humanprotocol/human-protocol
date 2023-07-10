import axios from 'axios';
import { useEffect, useState } from 'react';

type NewsItemType = {
  title?: string;
  description?: string;
  link?: string;
  image?: string;
};

export const useHumanProtocolNews = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<NewsItemType>({});

  useEffect(() => {
    (async () => {
      setIsLoading(true);

      const apiUrl = import.meta.env.VITE_APP_ADMIN_API_URL;
      const apiToken = import.meta.env.VITE_APP_BANNER_API_TOKEN;

      try {
        const url = `${apiUrl}/news-item?populate=*`;
        const { data } = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${apiToken}`,
          },
        });
        setData({
          title: data?.data?.attributes?.title,
          description: data?.data?.attributes?.description,
          link: data?.data?.attributes?.link,
          image: data?.data?.attributes?.image?.data?.attributes?.url,
        });
      } catch (err) {
        console.log(err);
      }
      setIsLoading(false);
    })();
  }, []);

  return { isLoading, data };
};
