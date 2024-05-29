import { notifications } from "@mantine/notifications";
import { useCallback, useEffect, useState } from "react";
import { IconCheck, IconExclamationCircle } from "@tabler/icons-react";
import { Loader } from "@mantine/core";

export const useNotificationHook = (
  loadingMessage: string,
  loading: boolean,
  error: string | undefined,
  message: string | undefined,
) => {
  const [notificationId, setNotificationId] = useState<string | undefined>();

  const showNotification = useCallback(() => {
    const id = notifications.show({
      message: loading ? loadingMessage : error ? error : message,
      loading,
      autoClose: 5000,
      onClose: () => {
        setNotificationId(undefined);
      },
      icon: loading ? (
        <Loader />
      ) : error ? (
        <IconExclamationCircle />
      ) : (
        <IconCheck />
      ),
    });

    setNotificationId(id);
  }, [loading, error, message, loadingMessage]);

  // on loading, error, message, loadingMessage, etc. update the notification
  useEffect(() => {
    if (notificationId) {
      notifications.update({
        id: notificationId,
        message: loading ? loadingMessage : error ? error : message,
        loading,
        icon: loading ? (
          <Loader />
        ) : error ? (
          <IconExclamationCircle />
        ) : (
          <IconCheck />
        ),
      });
    }
  }, [loading, error, message, loadingMessage, notificationId]);

  return {
    showNotification,
  };
};
