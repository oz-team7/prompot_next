import type { NextApiRequest, NextApiResponse } from "next";
import { createSupabaseServiceClient } from "@/lib/supabase-server";
import { requireAuth } from "@/lib/auth-utils";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "4mb",
    },
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  console.log("Request headers:", req.headers);
  console.log("NODE_ENV:", process.env.NODE_ENV);

  let authUser;
  try {
    authUser = await requireAuth(req);
    console.log("Auth user:", authUser);
  } catch (error) {
    console.log("Auth error:", error);
    
    if (process.env.NODE_ENV === "development") {
      console.log("Development mode: Using current user");
      // 현재 사용자 ID 사용 (브라우저에서 확인된 사용자)
      authUser = {
        id: "7b03565d-b472-477c-9321-75bb442ae60e",
        email: "prompot@gmail.com",
        user_metadata: { name: "prompot" }
      };
    } else {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }
  }
  
  const { title, description, content, category, tags, aiModel, previewImage, additionalImages, videoUrl, isPublic, resultType, textResult } = req.body;

  if (!title || !content || !category || !aiModel) {
    return res.status(400).json({ message: "제목, 프롬프트 내용, 카테고리, AI 모델은 필수입니다." });
  }

  try {
    const supabase = createSupabaseServiceClient();
    
    let processedTags = [];
    if (tags) {
      if (Array.isArray(tags)) {
        processedTags = tags.filter(tag => tag && typeof tag === "string" && tag.trim());
      } else if (typeof tags === "string") {
        processedTags = tags.split(",").map(tag => tag.trim()).filter(tag => tag);
      }
    }
    
    console.log("Processed tags:", processedTags);
    
    const insertData: any = {
      title,
      description,
      content,
      category,
      ai_model: aiModel,
      preview_image: previewImage || null,
      additional_images: additionalImages || [],
      video_url: videoUrl || null,
      is_public: isPublic ?? true,
      author_id: authUser.id,
      result_type: resultType || 'image',
      text_result: resultType === 'text' ? (textResult || '') : null,
    };
    
    if (processedTags.length > 0) {
      insertData.tags = processedTags;
    }
    
    const { data: prompt, error } = await supabase
      .from("prompts")
      .insert([insertData])
      .select(`
        *,
        author:profiles!author_id (
          id,
          name,
          email
        )
      `)
      .single();

    if (error || !prompt) {
      throw error || new Error("프롬프트 생성 실패");
    }

    res.status(201).json({
      prompt: {
        id: prompt.id,
        title: prompt.title,
        description: prompt.description,
        content: prompt.content,
        category: prompt.category,
        tags: prompt.tags || [],
        aiModel: prompt.ai_model,
        previewImage: prompt.preview_image,
        additionalImages: prompt.additional_images || [],
        videoUrl: prompt.video_url || null,
        isPublic: prompt.is_public,
        author: {
          id: prompt.author.id,
          name: prompt.author.name,
          email: prompt.author.email
        },
        date: new Date(prompt.created_at).toISOString().split("T")[0].replace(/-/g, "."),
        likes: 0,
        bookmarks: 0,
        rating: 0,
        totalRatings: 0,
      },
    });
  } catch (error) {
    console.error("Create prompt error:", error);
    
    // 에러 타입별 처리
    if (error instanceof Error) {
      // Supabase 관련 에러
      if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
        return res.status(409).json({ message: "이미 존재하는 프롬프트입니다." });
      }
      
      // 권한 관련 에러
      if (error.message.includes('permission') || error.message.includes('unauthorized')) {
        return res.status(403).json({ message: "프롬프트 생성 권한이 없습니다." });
      }
      
      // 데이터베이스 연결 에러
      if (error.message.includes('connection') || error.message.includes('timeout')) {
        return res.status(503).json({ message: "데이터베이스 연결에 문제가 있습니다. 잠시 후 다시 시도해주세요." });
      }
      
      // 일반적인 에러
      return res.status(500).json({ 
        message: "프롬프트 생성 중 오류가 발생했습니다.",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    // 알 수 없는 에러
    return res.status(500).json({ message: "알 수 없는 오류가 발생했습니다." });
  }
}
