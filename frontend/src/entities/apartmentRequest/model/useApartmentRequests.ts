import { useEffect, useState } from 'react';
import { getApartmentRequests } from '@/entities/apartmentRequest/api/apartment.api';
import { ApartmentRequest } from '../type';

const ITEMS_PER_PAGE = 11;

export function useApartmentRequests() {
  const [data, setData] = useState<ApartmentRequest[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'rejected' | 'pending'>(
    'all',
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const {totalCount, apartments} = await getApartmentRequests({page: currentPage, limit: ITEMS_PER_PAGE, searchKeyword, apartmentStatus: statusFilter == 'all' ? undefined : statusFilter.toUpperCase()});
        setData(apartments);
        setTotalCount(totalCount || 0);
      } catch (error) {
        console.error('아파트 요청 목록 불러오기 실패:', error);
      }
    };

    fetchData();
  }, [currentPage, searchKeyword, statusFilter]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return {
    data,
    currentPage,
    totalPages,
    setCurrentPage,
    searchKeyword,
    setSearchKeyword,
    statusFilter,
    setStatusFilter,
    totalCount
  };
}
