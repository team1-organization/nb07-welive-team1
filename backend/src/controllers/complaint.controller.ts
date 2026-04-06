import { Request, Response } from 'express';
import {
    createComplaintReqSchema,
    deleteComplaintReqSchema,
    getComplaintDetailReqSchema,
    getComplaintListReqSchema,
    updateComplaintReqSchema,
    updateComplaintStatusReqSchema,
} from '../dtos/complaint.dto';
import { withAsync } from '../lib/withAsync';
import { ComplaintService } from '../services/complaint.service';
import { serializeBigInt } from '../utils/object.util';

const complaintService = new ComplaintService();

export const createComplaint = withAsync(async (req: Request, res: Response) => {
    const validated = createComplaintReqSchema.parse({ user: req.user, body: req.body });
    const result = await complaintService.createComplaint(validated.user, validated.body);

    res.status(201).json({ message: '민원이 등록되었습니다.', data: serializeBigInt(result) });
});

export const getComplaintList = withAsync(async (req: Request, res: Response) => {
    const validated = getComplaintListReqSchema.parse({ user: req.user, query: req.query });
    const result = await complaintService.getComplaintList(validated.user, validated.query);

    res.status(200).json(serializeBigInt(result));
});

export const getComplaintDetail = withAsync(async (req: Request, res: Response) => {
    const validated = getComplaintDetailReqSchema.parse({ user: req.user, params: req.params });
    const result = await complaintService.getComplaintDetail(validated.params.complaintId, validated.user);

    res.status(200).json(serializeBigInt(result));
});

export const updateComplaint = withAsync(async (req: Request, res: Response) => {
    const validated = updateComplaintReqSchema.parse({ user: req.user, params: req.params, body: req.body });
    const result = await complaintService.updateComplaint(validated.params.complaintId, validated.user, validated.body);

    res.status(200).json({ message: '민원이 수정되었습니다.', data: serializeBigInt(result) });
});

export const updateComplaintStatus = withAsync(async (req: Request, res: Response) => {
    const validated = updateComplaintStatusReqSchema.parse({ user: req.user, params: req.params, body: req.body });
    const result = await complaintService.updateComplaintStatus(validated.params.complaintId, validated.user, validated.body.status);

    res.status(200).json({ message: '상태가 변경되었습니다.', data: serializeBigInt(result) });
});

export const deleteComplaint = withAsync(async (req: Request, res: Response) => {
    const validated = deleteComplaintReqSchema.parse({ user: req.user, params: req.params });
    await complaintService.deleteComplaint(validated.params.complaintId, validated.user);

    res.status(204).send();
});
