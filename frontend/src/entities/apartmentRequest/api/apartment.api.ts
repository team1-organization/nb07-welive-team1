import axios from '@/shared/lib/axios';

//아파트 리스트 호출 API
export interface ApartmentRequest {
  id: string;
  name: string;
  address: string;
  officeNumber: string;
  description: string;
  dongRange: {
    start: string;
    end: string;
  };
  hoRange: {
    start: string;
    end: string;
  };
  startComplexNumber: string;
  endComplexNumber: string;
  startDongNumber: string;
  endDongNumber: string;
  startFloorNumber: string;
  endFloorNumber: string;
  startHoNumber: string;
  endHoNumber: string;
  apartmentStatus: 'APPROVED' | 'PENDING' | 'REJECTED';
  adminId: string;
  adminName: string;
  adminContact: string;
  adminEmail: string;
}

export interface ApartmentRequestListResponse {
  apartments: ApartmentRequest[];
  totalCount?: number;
}

export const getApartmentRequests = async (
  params: {
    name?: string,
    address?: string,
    searchKeyword?: string, apartmentStatus?: string,
    page?: number, limit?: number
  }
): Promise<{
  apartments: ApartmentRequest[],
  totalCount?: number
}> => {
  const res = await axios.get<ApartmentRequestListResponse>('/apartments', { params });
  return res.data;
};
