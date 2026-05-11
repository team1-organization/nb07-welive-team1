import axios from '@/shared/lib/axios';
import { useEffect, useState } from 'react';
import { CivilListType } from '../type';

type Params = {
  page: number;
  limit: number;
  dong?: string;
  ho?: string;
  status?: string;
  isPublic?: boolean;
  keyword?: string;
};

type CivilResponse = {
  complaints: CivilListType[];
  totalCount: number;
};

export function useCivilList({ page, limit, status, isPublic, dong, ho, keyword }: Params) {
  const [data, setData] = useState<CivilResponse>({ complaints: [], totalCount: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  

  useEffect(() => {
    const fetchData = async () => {
      const filteredParams = Object.fromEntries(
    Object.entries({ status, isPublic, dong, ho, keyword }).filter(([, v]) => v !== undefined),
  );
      try {
        setLoading(true);
        setError(null);
        const res = await axios.get('/complaints', {
          params: {
            page,
            limit,
            ...filteredParams,
          },
        });

        if (res.data) {
          setData({
            complaints: res.data.list ?? [],
            totalCount: res.data.total ?? 0,
          });
        }
      } catch (err) {
        console.error('민원 데이터 불러오기 실패:', err);
        setError(err);
        setData({ complaints: [], totalCount: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [page, limit, status, isPublic, dong, ho, keyword]);

  return { data, loading, error };
}
