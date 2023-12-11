"use client";

import { createFolderAction } from "@/actions/create-folder-action";
import { invalidateCacheAction } from "@/actions/invalidate-cache-action";
import { resumableUpload } from "@/utils/upload";
import { createClient } from "@midday/supabase/client";
import { getCurrentUserTeamQuery } from "@midday/supabase/queries";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@midday/ui/context-menu";
import { useToast } from "@midday/ui/use-toast";
import { cn } from "@midday/ui/utils";
import { useAction } from "next-safe-action/hook";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";

export function UploadZone({ children }) {
  const supabase = createClient();
  const [progress, setProgress] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const [toastId, setToastId] = useState(null);
  const uploadProgress = useRef([]);
  const params = useParams();
  const folders = params?.folders ?? [];
  const folderPath = folders.join("/");
  const { toast, dismiss, update } = useToast();

  useEffect(() => {
    if (!toastId && showProgress) {
      const { id } = toast({
        title: `Uploading ${uploadProgress.current.length} files`,
        progress,
        variant: "progress",
        description: "Please do not close browser until completed",
        duration: Infinity,
      });

      setToastId(id);
    } else {
      update(toastId, {
        progress,
        title: `Uploading ${uploadProgress.current.length} files`,
      });
    }
  }, [showProgress, progress, toastId]);

  const isDefaultFolder = ["inbox", "exports", "transactions"].includes(
    folders.at(0)
  );

  const createFolder = useAction(createFolderAction, {
    onError: () => {
      toast({
        duration: 2500,
        variant: "error",
        title:
          "The folder already exists in the current directory. Please use a different name.",
      });
    },
  });

  const onDrop = async (files) => {
    // Set default progress
    uploadProgress.current = files.map(() => 0);

    setShowProgress(true);

    const { data: userData } = await getCurrentUserTeamQuery(supabase);
    const filePath = [userData?.team_id, ...folders];

    try {
      await Promise.all(
        files.map(async (file, idx) => {
          await resumableUpload(supabase, {
            bucket: "vault",
            path: filePath,
            file,
            onProgress: (bytesUploaded, bytesTotal) => {
              uploadProgress.current[idx] = (bytesUploaded / bytesTotal) * 100;

              const _progress = uploadProgress.current.reduce(
                (acc, currentValue) => {
                  return acc + currentValue;
                },
                0
              );

              setProgress(Math.round(_progress / files.length));
            },
          });
        })
      );

      // Reset once done
      uploadProgress.current = [];

      setProgress(0);
      toast({
        title: "Upload successfull.",
        variant: "success",
        duration: 2000,
      });

      setShowProgress(false);
      setToastId(null);
      dismiss(toastId);
      invalidateCacheAction([`vault_${userData.team_id}`]);
    } catch {
      toast({
        duration: 2500,
        variant: "error",
        title: "Something went wrong please try again.",
      });
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          {...getRootProps({ onClick: (evt) => evt.stopPropagation() })}
          className="relative h-full"
        >
          <div className="absolute top-0 bottom-0 right-0 left-0 z-50 pointer-events-none">
            <div
              className={cn(
                "bg-[#1A1A1A] h-full flex items-center justify-center text-center invisible",
                isDragActive && "visible"
              )}
            >
              <input {...getInputProps()} id="upload-files" />

              <p className="text-xs">
                Drop your files here, to
                <br /> upload to this folder.{" "}
              </p>
            </div>
          </div>

          {children}
        </div>
      </ContextMenuTrigger>

      {!isDefaultFolder && (
        <ContextMenuContent>
          <ContextMenuItem
            onClick={() =>
              createFolder.execute({
                path: folderPath,
                name: "Untitled folder",
              })
            }
          >
            Upload file
          </ContextMenuItem>

          <ContextMenuItem
            onClick={() =>
              createFolder.execute({
                path: folderPath,
                name: "Untitled folder",
              })
            }
          >
            Create folder
          </ContextMenuItem>
        </ContextMenuContent>
      )}
    </ContextMenu>
  );
}