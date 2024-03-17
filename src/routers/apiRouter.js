// api = 템플릿을 렌더링 하지 않을 때 프론트와 백엔드가 통신하는 방법
import express from "express";
import {
  createComment,
  deleteComment,
  registerView,
} from "../controllers/videoController";

const apiRouter = express.Router();

apiRouter.post("/videos/:id([0-9a-f]{24})/view", registerView);
apiRouter.post("/videos/:id([0-9a-f]{24})/comment", createComment);
apiRouter.delete("/comment/:id([0-9a-f]{24})/delete", deleteComment);

export default apiRouter;
