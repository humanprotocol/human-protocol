import React, { useState } from "react";
import Card from "@mui/material/Card";

import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

export default function PublicKey({
  publicKey,
  display = false,
  refresh = false,
  refetch,
  loading,
}: {
  publicKey: string;
  display?: boolean;
  refresh?: boolean;
  refetch?: any;
  loading?: boolean;
}) {
  const [reveal, setReveal] = useState(false);
  return (
    <>
      {display && (
        <Card className="minWidth275 marginLeft2 marginRight2 marginBottom2">
          <CardContent>
            <Typography
              className="fontSize14"
              color="text.secondary"
              gutterBottom
            >
              Public Key
            </Typography>
            <Button
              disabled={loading || !publicKey}
              variant="contained"
              onClick={() => setReveal(!reveal)}
            >
              Reveal Public Key
            </Button>
            {reveal && <Typography component="div">{publicKey}</Typography>}
            <div className="marginTop2">
              {refresh && (
                <Button
                  disabled={loading}
                  variant="contained"
                  onClick={refetch}
                >
                  Refresh Public Key
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
