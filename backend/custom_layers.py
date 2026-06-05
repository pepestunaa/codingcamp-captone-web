from tensorflow.keras import layers


class AttentionLayer(layers.Layer):
    def __init__(self, units, **kwargs):
        super(AttentionLayer, self).__init__(**kwargs)
        self.units = units
        self.dense = layers.Dense(units, activation='relu')
        self.attention = layers.Dense(units, activation='sigmoid')

    def call(self, inputs):
        features = self.dense(inputs)
        attention_weights = self.attention(inputs)
        return features * attention_weights

    def get_config(self):
        config = super().get_config()
        config.update({'units': self.units})
        return config