const Trade = require("../models/tradeRequest");


exports.createTrade = (req, res) => {

  
    Trade.create({ name: guruName }), function(err, trade) {
      if (err) {

        return res.status(400).json({
          error: "Request not found",
        });

      } else {
        return res.status(200).json({ trade });
      }
    };


  };